import { Building2, ClockArrowDown, ClockArrowUp, FileText, Radio, Users } from "lucide-react";
import { employeeName, getDashboardData } from "@/lib/data/admin";
import { formatDateTime } from "@/lib/format";

export default async function AdminPage() {
  const dashboard = await getDashboardData();
  const metrics = [
    { label: "Employees", value: dashboard.employeeCount, icon: Users, tone: "text-emerald-300" },
    { label: "Headquarters", value: dashboard.headquartersCount, icon: Building2, tone: "text-cyan-300" },
    { label: "Clock-ins today", value: dashboard.todayClockIns, icon: ClockArrowDown, tone: "text-teal-300" },
    { label: "Clock-outs today", value: dashboard.todayClockOuts, icon: ClockArrowUp, tone: "text-amber-300" },
    { label: "Work summaries", value: dashboard.summaryCount, icon: FileText, tone: "text-sky-300" },
  ];

  return (
    <div className="rise-in">
      <div className="flex flex-col gap-3 border-b border-white/8 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase text-emerald-300">Operations overview</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-200"><Radio className="size-3" /> Secure session active</div>
      </div>
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(({ icon: Icon, label, tone, value }) => (
          <div className="glass-panel rounded-lg p-5" key={label}>
            <Icon className={`size-5 ${tone}`} />
            <p className="mt-7 font-mono text-3xl font-semibold text-white">{value}</p>
            <p className="mt-2 text-xs text-slate-400">{label}</p>
          </div>
        ))}
      </section>
      <section className="glass-panel mt-6 overflow-hidden rounded-lg">
        <div className="border-b border-white/8 px-5 py-4"><h2 className="text-sm font-semibold text-white">Recent activity</h2></div>
        {dashboard.recentActivity.length ? (
          <div className="divide-y divide-white/6">
            {dashboard.recentActivity.map((log) => (
              <div className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[1fr_10rem_12rem] sm:items-center" key={log.timelog_id}>
                <span className="text-white">{employeeName(log.employee)}</span>
                <span className={log.log_type.toLowerCase().includes("in") ? "text-emerald-300" : "text-amber-300"}>{log.log_type.replaceAll("_", " ")}</span>
                <span className="text-xs text-slate-500 sm:text-right">{formatDateTime(log.timestamp)}</span>
              </div>
            ))}
          </div>
        ) : <p className="px-5 py-12 text-center text-sm text-slate-400">No recent activity.</p>}
      </section>
    </div>
  );
}