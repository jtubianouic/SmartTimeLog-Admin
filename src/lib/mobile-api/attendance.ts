import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type AttendanceType = "clock_in" | "break" | "break_end" | "clock_out";
export type AttendanceStatus = "not_clocked_in" | "clocked_in" | "on_break" | "clocked_out";

const allowedPreviousTypes: Record<AttendanceType, Array<AttendanceType | null>> = {
  clock_in: [null],
  break: ["clock_in", "break_end"],
  break_end: ["break"],
  clock_out: ["clock_in", "break", "break_end"],
};

function getTodayUtc() {
  const date = new Date().toISOString().slice(0, 10);
  return { date, start: `${date}T00:00:00.000Z`, end: `${date}T23:59:59.999Z` };
}

export async function getAttendanceStatus(employeeId: number) {
  const supabase = createAdminClient();
  const today = getTodayUtc();
  const { data: timelogs, error } = await supabase
    .from("employee_timelogs")
    .select("timelog_id, employee_id, log_type, lat, long, timestamp")
    .eq("employee_id", employeeId)
    .gte("timestamp", today.start)
    .lte("timestamp", today.end)
    .order("timestamp", { ascending: true })
    .order("timelog_id", { ascending: true });

  if (error) return { error: "unavailable" as const };
  const latest = timelogs.at(-1);
  const latestType = latest?.log_type.toLowerCase() as AttendanceType | undefined;
  const statuses: Record<AttendanceType, AttendanceStatus> = {
    clock_in: "clocked_in",
    break: "on_break",
    break_end: "clocked_in",
    clock_out: "clocked_out",
  };

  const now = Date.now();
  const clockIn = timelogs.find((timelog) => timelog.log_type.toLowerCase() === "clock_in");
  const clockInTime = clockIn?.timestamp ? Date.parse(clockIn.timestamp) : Number.NaN;
  const clockOutTime =
    latestType === "clock_out" && latest?.timestamp ? Date.parse(latest.timestamp) : now;
  const clockedInDurationSeconds = Number.isFinite(clockInTime)
    ? Math.max(0, Math.floor((clockOutTime - clockInTime) / 1000))
    : 0;

  let breakStartedAt: number | null = null;
  let breakDurationMilliseconds = 0;
  for (const timelog of timelogs) {
    const timestamp = timelog.timestamp ? Date.parse(timelog.timestamp) : Number.NaN;
    if (!Number.isFinite(timestamp)) continue;

    const logType = timelog.log_type.toLowerCase() as AttendanceType;
    if (logType === "break" && breakStartedAt === null) breakStartedAt = timestamp;
    if ((logType === "break_end" || logType === "clock_out") && breakStartedAt !== null) {
      breakDurationMilliseconds += Math.max(0, timestamp - breakStartedAt);
      breakStartedAt = null;
    }
  }
  const currentBreakDurationSeconds =
    breakStartedAt === null ? 0 : Math.floor(Math.max(0, now - breakStartedAt) / 1000);
  if (breakStartedAt !== null) breakDurationMilliseconds += Math.max(0, now - breakStartedAt);

  return {
    date: today.date,
    status: latestType && statuses[latestType] ? statuses[latestType] : "not_clocked_in",
    clockedInDurationSeconds,
    breakDurationSeconds: Math.floor(breakDurationMilliseconds / 1000),
    currentBreakDurationSeconds,
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