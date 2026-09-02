"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const employeeSchema = z
  .object({
    employee_id: z.coerce.number().int().positive().optional(),
    firstname: z.string().trim().min(1, "First name is required.").max(80),
    lastname: z.string().trim().min(1, "Last name is required.").max(80),
    username: z.string().trim().min(3, "Username must have at least 3 characters.").max(80),
    hq_id: z.coerce.number().int().positive("Headquarters is required."),
    password: z.string().max(128),
    confirmPassword: z.string(),
  })
  .superRefine((value, context) => {
    if (!value.employee_id && value.password.length < 8) {
      context.addIssue({ code: "custom", message: "Password must have at least 8 characters.", path: ["password"] });
    }
    if (value.password && value.password.length < 8) {
      context.addIssue({ code: "custom", message: "Password must have at least 8 characters.", path: ["password"] });
    }
    if (value.password !== value.confirmPassword) {
      context.addIssue({ code: "custom", message: "Passwords do not match.", path: ["confirmPassword"] });
    }
  });

export type EmployeeState = {
  status?: "error" | "success";
  message?: string;
  errors?: Partial<Record<"firstname" | "lastname" | "username" | "hq_id" | "password" | "confirmPassword", string[]>>;
};

export async function createEmployee(
  _state: EmployeeState,
  formData: FormData,
): Promise<EmployeeState> {
  await requireAdmin();
  const parsed = employeeSchema.safeParse({
    employee_id: formData.get("employee_id") || undefined,
    firstname: formData.get("firstname"),
    lastname: formData.get("lastname"),
    username: formData.get("username"),
    hq_id: formData.get("hq_id"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { status: "error", errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = createAdminClient();
  let duplicateQuery = supabase
    .from("employee")
    .select("employee_id")
    .eq("username", parsed.data.username);
  if (parsed.data.employee_id) duplicateQuery = duplicateQuery.neq("employee_id", parsed.data.employee_id);

  const [{ data: duplicate, error: duplicateError }, { data: headquarters, error: headquartersError }, employeeResult] =
    await Promise.all([
      duplicateQuery.maybeSingle(),
      supabase
        .from("headquarters")
        .select("hq_id")
        .eq("hq_id", parsed.data.hq_id)
        .eq("isDeleted", false)
        .maybeSingle(),
        parsed.data.employee_id
        ? supabase
          .from("employee")
              .select("employee_id, isDeleted")
          .eq("employee_id", parsed.data.employee_id)
          .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

  if (duplicateError) return { status: "error", message: "Unable to validate the username." };
  if (headquartersError) return { status: "error", message: "Unable to validate headquarters." };
  if (employeeResult.error) return { status: "error", message: "Unable to validate employee." };
  if (duplicate) return { status: "error", errors: { username: ["Username is already registered."] } };
  if (!headquarters) return { status: "error", errors: { hq_id: ["Select an active headquarters."] } };
  if (parsed.data.employee_id && (!employeeResult.data || employeeResult.data.isDeleted === true)) {
    return { status: "error", message: "Employee is no longer active." };
  }

  const employee = {
    firstname: parsed.data.firstname,
    lastname: parsed.data.lastname,
    username: parsed.data.username,
    hq_id: parsed.data.hq_id,
  };
  const password = parsed.data.password ? { password: await hash(parsed.data.password, 12) } : {};
  const { error } = parsed.data.employee_id
    ? await supabase.from("employee").update({ ...employee, ...password }).eq("employee_id", parsed.data.employee_id)
    : await supabase.from("employee").insert({ ...employee, ...password, password: password.password! });

  if (error) return { status: "error", message: parsed.data.employee_id ? "Unable to update employee." : "Unable to register employee." };
  revalidatePath("/admin");
  revalidatePath("/admin/employees");
  revalidatePath("/admin/timelogs");
  revalidatePath("/admin/summaries");
  return { status: "success", message: parsed.data.employee_id ? "Employee updated successfully." : "Employee registered successfully." };
}

export async function setEmployeeDeleted(formData: FormData) {
  await requireAdmin();
  const id = z.coerce.number().int().positive().safeParse(formData.get("employee_id"));
  const isDeleted = z.enum(["true", "false"]).safeParse(formData.get("isDeleted"));
  if (!id.success || !isDeleted.success) throw new Error("Invalid employee request.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("employee")
    .update({ isDeleted: isDeleted.data === "true" })
    .eq("employee_id", id.data);

  if (error) throw new Error("Unable to update employee status.");
  revalidatePath("/admin");
  revalidatePath("/admin/employees");
  revalidatePath("/admin/timelogs");
  revalidatePath("/admin/summaries");
}