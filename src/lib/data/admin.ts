import "server-only";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database";

export type Employee = Pick<
  Tables<"employee">,
  "employee_id" | "username" | "firstname" | "lastname" | "hq_id" | "created_at" | "updated_at" | "isDeleted"
>;
export type Headquarters = Tables<"headquarters">;
export type Timelog = Tables<"employee_timelogs">;
export type WorkSummary = Tables<"employee_clock_out_logs">;

export type TimelogView = Timelog & { employee: Employee | null };
export type SummaryView = WorkSummary & {
  timelog: TimelogView | null;
};

function mapEmployees(employees: Employee[]) {
  return new Map(employees.map((employee) => [employee.employee_id, employee]));
}

export function employeeName(employee: Employee | null) {
  if (!employee) return "Unknown employee";
  const fullName = [employee.firstname, employee.lastname].filter(Boolean).join(" ");
  return fullName || employee.username;
}

export async function getEmployees(search = "") {
  await requireAdmin();
  const supabase = createAdminClient();
  let query = supabase
    .from("employee")
    .select("employee_id, username, firstname, lastname, hq_id, created_at, updated_at, isDeleted")
    .order("lastname", { ascending: true })
    .limit(100);

  if (search.trim()) {
    const safeSearch = search.trim().replaceAll(/[,%()]/g, "");
    query = query.or(
      `username.ilike.%${safeSearch}%,firstname.ilike.%${safeSearch}%,lastname.ilike.%${safeSearch}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw new Error("Unable to load employees.");
  return data;
}

export async function getHeadquarters() {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("headquarters")
    .select("hq_id, hq_name, lat, long, created_at, isDeleted")
    .order("hq_name", { ascending: true });

  if (error) throw new Error("Unable to load headquarters.");
  return data;
}

export async function getTimelogs(filters?: {
  employeeId?: number;
  logType?: string;
  from?: string;
  to?: string;
}) {
  await requireAdmin();
  const supabase = createAdminClient();
  let query = supabase
    .from("employee_timelogs")
    .select("timelog_id, employee_id, lat, long, log_type, timestamp")
    .order("timestamp", { ascending: false })
    .limit(100);

  if (filters?.employeeId) query = query.eq("employee_id", filters.employeeId);
  if (filters?.logType) query = query.eq("log_type", filters.logType);
  if (filters?.from) query = query.gte("timestamp", `${filters.from}T00:00:00.000Z`);
  if (filters?.to) query = query.lte("timestamp", `${filters.to}T23:59:59.999Z`);

  const [{ data: logs, error }, employees] = await Promise.all([query, getEmployees()]);
  if (error) throw new Error("Unable to load timelogs.");
  const byEmployee = mapEmployees(employees);
  return logs.map((log) => ({
    ...log,
    employee: log.employee_id ? byEmployee.get(log.employee_id) ?? null : null,
  }));
}

export async function getSummaries() {
  await requireAdmin();
  const supabase = createAdminClient();
  const [{ data: summaries, error }, timelogs] = await Promise.all([
    supabase
      .from("employee_clock_out_logs")
      .select("log_id, timelog_id, employee_input, employee_ai_summary, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    getTimelogs(),
  ]);

  if (error) throw new Error("Unable to load work summaries.");
  const byTimelog = new Map(timelogs.map((timelog) => [timelog.timelog_id, timelog]));
  return summaries.map((summary) => ({
    ...summary,
    timelog: summary.timelog_id ? byTimelog.get(summary.timelog_id) ?? null : null,
  }));
}

export async function getDashboardData() {
  const [employees, headquarters, timelogs, summaries] = await Promise.all([
    getEmployees(),
    getHeadquarters(),
    getTimelogs(),
    getSummaries(),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = timelogs.filter((log) => log.timestamp?.startsWith(today));

  return {
    employeeCount: employees.filter((employee) => employee.isDeleted !== true).length,
    headquartersCount: headquarters.filter((hq) => !hq.isDeleted).length,
    todayClockIns: todayLogs.filter((log) => log.log_type.toLowerCase().includes("in")).length,
    todayClockOuts: todayLogs.filter((log) => log.log_type.toLowerCase().includes("out")).length,
    summaryCount: summaries.length,
    recentActivity: timelogs.slice(0, 8),
  };
}