import { getAttendanceStatus } from "@/lib/mobile-api/attendance";
import { authenticateMobileRequest } from "@/lib/mobile-api/auth";
import { apiError, noStoreHeaders } from "@/lib/mobile-api/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const employee = await authenticateMobileRequest(request);
  if (!employee) return apiError(401, "Authentication required.");

  const result = await getAttendanceStatus(employee.employee_id);
  if (result.error) return apiError(503, "Unable to load attendance status.");

  return Response.json({ ok: true, ...result }, { headers: noStoreHeaders });
}