import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type AttendanceType = "clock_in" | "break" | "clock_out";

const allowedPreviousTypes: Record<AttendanceType, Array<AttendanceType | null>> = {
  clock_in: [null, "clock_out"],
  break: ["clock_in"],
  clock_out: ["clock_in", "break"],
};

export async function recordAttendance(
  employeeId: number,
  logType: AttendanceType,
  coordinates: { lat: number; long: number },
) {
  const supabase = createAdminClient();
  const { data: latest, error: latestError } = await supabase
    .from("employee_timelogs")
    .select("log_type")
    .eq("employee_id", employeeId)
    .order("timestamp", { ascending: false })
    .order("timelog_id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) return { error: "unavailable" as const };
  const previousType = (latest?.log_type?.toLowerCase() ?? null) as AttendanceType | null;
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