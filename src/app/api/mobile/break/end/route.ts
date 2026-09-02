import { recordAttendance } from "@/lib/mobile-api/attendance";
import { authenticateMobileRequest } from "@/lib/mobile-api/auth";
import { apiError, coordinatesSchema, noStoreHeaders, parseJson } from "@/lib/mobile-api/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const employee = await authenticateMobileRequest(request);
  if (!employee) return apiError(401, "Authentication required.");

  const parsed = await parseJson(request, coordinatesSchema);
  if (!parsed?.success) return apiError(400, "Valid latitude and longitude are required.");

  const result = await recordAttendance(employee.employee_id, "break_end", parsed.data);
  if (result.error === "invalid_transition") return apiError(409, "Employee is not currently on break.");
  if (result.error) return apiError(503, "Unable to end break.");

  return Response.json({ ok: true, timelog: result.timelog }, { status: 201, headers: noStoreHeaders });
}