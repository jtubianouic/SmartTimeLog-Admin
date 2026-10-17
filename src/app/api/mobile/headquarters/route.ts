import { apiError, noStoreHeaders } from "@/lib/mobile-api/http";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { data, error } = await createAdminClient()
      .from("headquarters")
      .select("hq_id, hq_name")
      .eq("isDeleted", false)
      .order("hq_name", { ascending: true });

    if (error) return apiError(503, "Unable to load headquarters.");
    return Response.json(
      data.map(({ hq_id, hq_name }) => ({ hq_id, hq_name })),
      { headers: noStoreHeaders },
    );
  } catch (error) {
    console.error("Headquarters list request failed:", error);
    return apiError(503, "Unable to load headquarters.");
  }
}
