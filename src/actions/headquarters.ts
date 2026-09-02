"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const headquartersSchema = z.object({
  hq_id: z.coerce.number().int().positive().optional(),
  hq_name: z.string().trim().min(1, "Headquarters name is required.").max(120),
  lat: z.coerce.number().min(-90).max(90),
  long: z.coerce.number().min(-180).max(180),
});

export type HeadquartersState = { status?: "error" | "success"; message?: string };

export async function createHeadquarters(
  _state: HeadquartersState,
  formData: FormData,
): Promise<HeadquartersState> {
  await requireAdmin();
  const parsed = headquartersSchema.safeParse({
    hq_id: formData.get("hq_id") || undefined,
    hq_name: formData.get("hq_name"),
    lat: formData.get("lat"),
    long: formData.get("long"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid location." };
  }

  const supabase = createAdminClient();
  const { hq_id, ...headquarters } = parsed.data;
  const { error } = hq_id
    ? await supabase.from("headquarters").update(headquarters).eq("hq_id", hq_id)
    : await supabase.from("headquarters").insert(headquarters);
  if (error) return { status: "error", message: "Unable to save headquarters." };

  revalidatePath("/admin");
  revalidatePath("/admin/headquarters");
  return { status: "success", message: hq_id ? "Headquarters updated." : "Headquarters saved." };
}

export async function setHeadquartersDeleted(formData: FormData) {
  await requireAdmin();
  const id = z.coerce.number().int().positive().safeParse(formData.get("hq_id"));
  const isDeleted = z.enum(["true", "false"]).safeParse(formData.get("isDeleted"));
  if (!id.success || !isDeleted.success) throw new Error("Invalid headquarters request.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("headquarters")
    .update({ isDeleted: isDeleted.data === "true" })
    .eq("hq_id", id.data);
  if (error) throw new Error("Unable to update headquarters status.");

  revalidatePath("/admin");
  revalidatePath("/admin/headquarters");
}