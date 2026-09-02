"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const employeeSchema = z
  .object({
    firstname: z.string().trim().min(1, "First name is required.").max(80),
    lastname: z.string().trim().min(1, "Last name is required.").max(80),
    username: z.string().trim().min(3, "Username must have at least 3 characters.").max(80),
    password: z.string().min(8, "Password must have at least 8 characters.").max(128),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type EmployeeState = {
  status?: "error" | "success";
  message?: string;
  errors?: Partial<Record<"firstname" | "lastname" | "username" | "password" | "confirmPassword", string[]>>;
};

export async function createEmployee(
  _state: EmployeeState,
  formData: FormData,
): Promise<EmployeeState> {
  await requireAdmin();
  const parsed = employeeSchema.safeParse({
    firstname: formData.get("firstname"),
    lastname: formData.get("lastname"),
    username: formData.get("username"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { status: "error", errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = createAdminClient();
  const { data: duplicate, error: duplicateError } = await supabase
    .from("employee")
    .select("employee_id")
    .eq("username", parsed.data.username)
    .maybeSingle();

  if (duplicateError) return { status: "error", message: "Unable to validate the username." };
  if (duplicate) return { status: "error", errors: { username: ["Username is already registered."] } };

  const passwordHash = await hash(parsed.data.password, 12);
  const { error } = await supabase.from("employee").insert({
    firstname: parsed.data.firstname,
    lastname: parsed.data.lastname,
    username: parsed.data.username,
    password: passwordHash,
  });

  if (error) return { status: "error", message: "Unable to register employee." };
  revalidatePath("/admin");
  revalidatePath("/admin/employees");
  return { status: "success", message: "Employee registered successfully." };
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