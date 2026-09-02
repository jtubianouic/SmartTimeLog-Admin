import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type AttendanceType = "clock_in" | "break" | "clock_out";
export type AttendanceStatus = "not_clocked_in" | "clocked_in" | "on_break" | "clocked_out";

const allowedPreviousTypes: Record<AttendanceType, Array<AttendanceType | null>> = {
  clock_in: [null],
  break: ["clock_in"],
  clock_out: ["clock_in", "break"],
};

function getTodayUtc() {
  const date = new Date().toISOString().slice(0, 10);
  return { date, start: `${date}T00:00:00.000Z`, end: `${date}T23:59:59.999Z` };
}

export async function getAttendanceStatus(employeeId: number) {
  const supabase = createAdminClient();
  const today = getTodayUtc();
  const { data: latest, error } = await supabase
    .from("employee_timelogs")
    .select("timelog_id, employee_id, log_type, lat, long, timestamp")
    .eq("employee_id", employeeId)
    .gte("timestamp", today.start)
    .lte("timestamp", today.end)
    .order("timestamp", { ascending: false })
    .order("timelog_id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { error: "unavailable" as const };
  const latestType = latest?.log_type.toLowerCase() as AttendanceType | undefined;
  const statuses: Record<AttendanceType, AttendanceStatus> = {
    clock_in: "clocked_in",
    break: "on_break",
    clock_out: "clocked_out",
  };

  return {
    date: today.date,
    status: latestType && statuses[latestType] ? statuses[latestType] : "not_clocked_in",
    latestTimelog: latest ?? null,
  };
}

export async function recordAttendance(
  employeeId: number,
  logType: AttendanceType,
  coordinates: { lat: number; long: number },
) {
  const supabase = createAdminClient();
  const current = await getAttendanceStatus(employeeId);
  if (current.error) return current;
  const previousType = (current.latestTimelog?.log_type.toLowerCase() ?? null) as AttendanceType | null;
  if (!allowedPreviousTypes[logType].includes(previousType)) {
    return { error: "invalid_transition" as const, previousType };
  }

  const { data: timelog, error } = await supabase
    .from("employee_timelogs")
    .insert({ employee_id: employeeId, log_type: logType, ...coordinates })
    .select("timelog_id, employee_id, log_type, lat, long, timestamp")
    .single();

  if (error) return { error: "unavailable" as const };
  return { timelog };
}