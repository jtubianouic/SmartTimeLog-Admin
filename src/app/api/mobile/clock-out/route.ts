import { z } from "zod";
import { recordAttendance } from "@/lib/mobile-api/attendance";
import { authenticateMobileRequest } from "@/lib/mobile-api/auth";
import { apiError, coordinatesSchema, noStoreHeaders, parseJson } from "@/lib/mobile-api/http";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const clockOutSchema = coordinatesSchema.extend({
  employeeInput: z.string().trim().min(1).max(10_000),
});

export async function POST(request: Request) {
  const employee = await authenticateMobileRequest(request);
  if (!employee) return apiError(401, "Authentication required.");

  const parsed = await parseJson(request, clockOutSchema);
  if (!parsed?.success) return apiError(400, "Location and employee input are required.");

  const { employeeInput, ...coordinates } = parsed.data;
  const result = await recordAttendance(employee.employee_id, "clock_out", coordinates);
  if (result.error === "invalid_transition") return apiError(409, "Clock-out requires an active clock-in.");
  if (result.error) return apiError(503, "Unable to record clock-out.");

  const supabase = createAdminClient();
  const { data: clockOutLog, error } = await supabase
    .from("employee_clock_out_logs")
    .insert({ timelog_id: result.timelog.timelog_id, employee_input: employeeInput })
    .select("log_id, timelog_id, employee_input, employee_ai_summary, created_at")
    .single();

  if (error) {
    await supabase.from("employee_timelogs").delete().eq("timelog_id", result.timelog.timelog_id);
    return apiError(503, "Unable to save clock-out details.");
  }

  return Response.json(
    { ok: true, timelog: result.timelog, clockOutLog },
    { status: 201, headers: noStoreHeaders },
  );
}