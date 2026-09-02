import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { issueMobileToken, mobileTokenLifetimeSeconds } from "@/lib/mobile-api/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const loginSchema = z.object({
  username: z.string().trim().min(1).max(80),
  plainPassword: z.string().min(1).max(128),
});

const dummyPasswordHash = hash("smarttimelog-invalid-password", 12);

const responseHeaders = {
  "Cache-Control": "no-store",
};

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 4096) {
    return Response.json({ ok: false, message: "Invalid request." }, { status: 413, headers: responseHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, message: "Invalid request." }, { status: 400, headers: responseHeaders });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, message: "Invalid request." }, { status: 400, headers: responseHeaders });
  }

  const supabase = createAdminClient();
  const { data: employee, error } = await supabase
    .from("employee")
    .select("employee_id, username, password, firstname, lastname, hq_id, isDeleted, headquarters(hq_id, hq_name, lat, long)")
    .eq("username", parsed.data.username)
    .maybeSingle();

  if (error) {
    return Response.json(
      { ok: false, message: "Authentication service is unavailable." },
      { status: 503, headers: responseHeaders },
    );
  }

  const passwordMatches = await compare(
    parsed.data.plainPassword,
    employee?.password ?? (await dummyPasswordHash),
  );

  if (!employee || !passwordMatches || employee.isDeleted === true) {
    return Response.json(
      { ok: false, message: "Invalid username or password." },
      { status: 401, headers: responseHeaders },
    );
  }

  const accessToken = await issueMobileToken(employee.employee_id);

  return Response.json(
    {
      ok: true,
      accessToken,
      tokenType: "Bearer",
      expiresIn: mobileTokenLifetimeSeconds,
      employee: {
        employeeId: employee.employee_id,
        username: employee.username,
        firstName: employee.firstname,
        lastName: employee.lastname,
        headquarters: employee.headquarters,
      },
    },
    { headers: responseHeaders },
  );
}