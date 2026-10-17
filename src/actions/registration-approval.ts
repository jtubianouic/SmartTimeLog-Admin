"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { approveRegistrationWithToken } from "@/lib/registration-approval";

export async function approveRegistrationFromEmail(formData: FormData) {
  const token = formData.get("token");
  if (typeof token !== "string" || !(await approveRegistrationWithToken(token))) {
    redirect("/registration-approval?result=unavailable");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/employees");
  revalidatePath("/admin/timelogs");
  revalidatePath("/admin/summaries");
  redirect("/registration-approval?result=approved");
}
