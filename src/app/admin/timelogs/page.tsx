import { Clock3, MapPin } from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeading } from "@/components/admin/page-heading";
import { LocationPreview } from "@/components/maps/location-preview";
import { employeeName, getEmployees, getTimelogs } from "@/lib/data/admin";
import { formatCoordinate, formatDateTime } from "@/lib/format";

export default async function TimelogsPage({ searchParams }: { searchParams: Promise<{ employee?: string; type?: string; from?: string; to?: string }> }) {
  const filters = await searchParams;
  const employeeId = Number(filters.employee) || undefined;
  const [logs, employees] = await Promise.all([getTimelogs({ employeeId, logType: filters.type, from: filters.from, to: filters.to }), getEmployees()]);

  return (
    <div className="rise-in">
      <PageHeading eyebrow="Attendance activity" icon={Clock3} title="Timelogs" description="The latest 100 records are loaded from Supabase with server-side filters." />
      <form className="mt-6 flex flex-wrap gap-2">
        <select className="focus-ring h-11 rounded-md border border-white/10 bg-[#0b1b19] px-3 text-sm" defaultValue={filters.employee ?? ""} name="employee"><option value="">All employees</option>{employees.map((employee) => <option key={employee.employee_id} value={employee.employee_id}>{employeeName(employee)}</option>)}</select>
        <select className="focus-ring h-11 rounded-md border border-white/10 bg-[#0b1b19] px-3 text-sm" defaultValue={filters.type ?? ""} name="type"><option value="">All log types</option><option value="clock_in">Clock in</option><option value="clock_out">Clock out</option></select>
        <input aria-label="From date" className="focus-ring h-11 rounded-md border border-white/10 bg-[#0b1b19] px-3 text-sm" defaultValue={filters.from ?? ""} name="from" type="date" />
        <input aria-label="To date" className="focus-ring h-11 rounded-md border border-white/10 bg-[#0b1b19] px-3 text-sm" defaultValue={filters.to ?? ""} name="to" type="date" />
        <button className="focus-ring rounded-md bg-emerald-300 px-4 text-sm font-semibold text-emerald-950" type="submit">Apply filters</button>
      </form>
      <div className="glass-panel mt-6 overflow-x-auto rounded-lg">
        {logs.length ? <table className="w-full min-w-[60rem] text-left text-sm"><thead className="border-b border-white/8 text-xs text-slate-500"><tr><th className="px-5 py-4 font-medium">Employee</th><th className="px-5 py-4 font-medium">Type</th><th className="px-5 py-4 font-medium">Timestamp</th><th className="px-5 py-4 font-medium">Location</th></tr></thead><tbody className="divide-y divide-white/6">{logs.map((log) => <tr key={log.timelog_id}><td className="px-5 py-4 text-white">{employeeName(log.employee)}</td><td className="px-5 py-4"><span className={`rounded px-2 py-1 font-mono text-[10px] uppercase ${log.log_type.toLowerCase().includes("in") ? "bg-emerald-300/10 text-emerald-300" : "bg-amber-300/10 text-amber-300"}`}>{log.log_type.replaceAll("_", " ")}</span></td><td className="px-5 py-4 text-slate-400">{formatDateTime(log.timestamp)}</td><td className="px-5 py-4 font-mono text-xs text-slate-400"><details><summary className="flex cursor-pointer list-none items-center gap-2 text-cyan-300"><MapPin className="size-3" />{formatCoordinate(log.lat)}, {formatCoordinate(log.long)}</summary><div className="mt-3 w-80"><LocationPreview lat={log.lat} lng={log.long} /></div></details></td></tr>)}</tbody></table> : <EmptyState message="No timelogs match these filters." />}
      </div>
    </div>
  );
}