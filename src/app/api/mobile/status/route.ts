import { getAttendanceStatus, getTimelogHistory } from "@/lib/mobile-api/attendance";
import { authenticateMobileRequest } from "@/lib/mobile-api/auth";
import { apiError, noStoreHeaders } from "@/lib/mobile-api/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const employee = await authenticateMobileRequest(request);
  if (!employee) return apiError(401, "Authentication required.");

  const [status, history] = await Promise.all([
    getAttendanceStatus(employee.employee_id),
    getTimelogHistory(employee.employee_id),
  ]);
  if (status.error || history.error) return apiError(503, "Unable to load attendance status.");

  return Response.json(
    { ok: true, ...status, timelogs: history.timelogs },
    { headers: noStoreHeaders },
  );
}
