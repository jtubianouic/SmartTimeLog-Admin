import { hash } from "bcryptjs";
import { z } from "zod";
import { apiError, noStoreHeaders, parseJson } from "@/lib/mobile-api/http";
import { notifyPendingRegistration } from "@/lib/notifications/pending-registration";
import { createRegistrationApprovalToken } from "@/lib/registration-approval";
import { isValidRegistrationAccessToken } from "@/lib/registration-access-token";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const registerSchema = z.strictObject({
  registrationToken: z.string().regex(/^[0-9a-f]{64}$/),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  username: z.string().trim().min(3).max(80),
  plainPassword: z.string().min(8).max(128),
  headquartersId: z.number().int().positive(),
});

export async function POST(request: Request) {
  const parsed = await parseJson(request, registerSchema);
  if (!parsed?.success) return apiError(400, "Invalid registration request.");

  const input = parsed.data;
  try {
    if (!(await isValidRegistrationAccessToken(input.registrationToken))) {
      return apiError(401, "Registration token is invalid or expired.");
    }

    const supabase = createAdminClient();
    const [{ data: existing, error: existingError }, { data: headquarters, error: headquartersError }] = await Promise.all([
      supabase.from("employee").select("employee_id").eq("username", input.username).maybeSingle(),
      supabase.from("headquarters")
        .select("hq_id, hq_name, lat, long")
        .eq("hq_id", input.headquartersId)
        .eq("isDeleted", false)
        .maybeSingle(),
    ]);
    if (existingError || headquartersError) return apiError(503, "Registration service is unavailable.");
    if (existing) return apiError(409, "Username is already registered.");
    if (!headquarters) return apiError(400, "Select an active headquarters.");

    const password = await hash(input.plainPassword, 12);
    // A token can expire while the password is being hashed.
    if (!(await isValidRegistrationAccessToken(input.registrationToken))) {
      return apiError(401, "Registration token is invalid or expired.");
    }

    const { data: employee, error: insertError } = await supabase.from("employee")
      .insert({
        firstname: input.firstName,
        lastname: input.lastName,
        username: input.username,
        hq_id: headquarters.hq_id,
        password,
        registration_access_token: input.registrationToken,
        isPending: true,
      })
      .select("employee_id, created_at")
      .single();
    if (insertError?.code === "23505") return apiError(409, "Username is already registered.");
    if (insertError || !employee) return apiError(503, "Unable to register employee.");

    try {
      const approvalToken = createRegistrationApprovalToken(employee.employee_id, employee.created_at!);
      await notifyPendingRegistration(approvalToken);
    } catch (error) {
      console.error("Pending registration email failed:", error);
    }

    return Response.json({
      ok: true,
      isPending: true,
      employee: {
        employeeId: employee.employee_id,
        username: input.username,
        firstName: input.firstName,
        lastName: input.lastName,
        headquarters,
      },
    }, { status: 201, headers: noStoreHeaders });
  } catch (error) {
    console.error("Employee registration failed:", error);
    return apiError(503, "Registration service is unavailable.");
  }
}
