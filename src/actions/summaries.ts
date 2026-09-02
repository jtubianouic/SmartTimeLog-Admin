"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { summarizeWorkInput } from "@/lib/ai/gemini";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function regenerateSummary(formData: FormData) {
  await requireAdmin();
  const id = z.coerce.number().int().positive().safeParse(formData.get("log_id"));
  if (!id.success) throw new Error("Invalid summary record.");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("employee_clock_out_logs")
    .select("employee_input")
    .eq("log_id", id.data)
    .single();

  if (error || !data.employee_input?.trim()) {
    throw new Error("This record has no employee input to summarize.");
  }

  const summary = await summarizeWorkInput(data.employee_input);
  const { error: updateError } = await supabase
    .from("employee_clock_out_logs")
    .update({ employee_ai_summary: summary })
    .eq("log_id", id.data);

  if (updateError) throw new Error("Unable to save the generated summary.");
  revalidatePath("/admin/summaries");
}