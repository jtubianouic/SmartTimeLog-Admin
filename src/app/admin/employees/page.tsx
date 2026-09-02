import Link from "next/link";
import { Archive, Pencil, RotateCcw, Search, Users } from "lucide-react";
import { setEmployeeDeleted } from "@/actions/employees";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeading } from "@/components/admin/page-heading";
import { EmployeeForm } from "@/components/employees/employee-form";
import { employeeName, getEmployees, getHeadquarters } from "@/lib/data/admin";
import { formatDateTime } from "@/lib/format";

export default async function EmployeesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; edit?: string }> }) {
  const { q = "", status = "active", edit } = await searchParams;
  const removed = status === "removed";
  const [allEmployees, allHeadquarters] = await Promise.all([getEmployees(q), getHeadquarters()]);
  const employees = allEmployees.filter((employee) => (employee.isDeleted === true) === removed);
  const headquarters = allHeadquarters.filter((hq) => !hq.isDeleted);
  const selectedEmployee = !removed ? employees.find((employee) => employee.employee_id === Number(edit)) : undefined;
  const headquartersById = new Map(allHeadquarters.map((hq) => [hq.hq_id, hq.hq_name || `Headquarters ${hq.hq_id}`]));

  return (
    <div className="rise-in">
      <PageHeading eyebrow="People directory" icon={Users} title="Employees" description="Employee credentials are never selected or displayed in this dashboard." />
      {!removed ? <EmployeeForm headquarters={headquarters} key={selectedEmployee?.employee_id ?? "new"} selected={selectedEmployee} /> : null}
      <div className="mt-6 flex gap-1 border-b border-white/8">
        <Link className={`focus-ring px-4 py-3 text-sm ${!removed ? "border-b-2 border-emerald-300 text-emerald-200" : "text-slate-500 hover:text-white"}`} href="/admin/employees">Active</Link>
        <Link className={`focus-ring px-4 py-3 text-sm ${removed ? "border-b-2 border-emerald-300 text-emerald-200" : "text-slate-500 hover:text-white"}`} href="/admin/employees?status=removed">Removed</Link>
      </div>
      <form className="mt-6 flex max-w-md gap-2">
        {removed ? <input name="status" type="hidden" value="removed" /> : null}
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" /><input className="focus-ring h-11 w-full rounded-md border border-white/10 bg-black/20 pl-10 pr-3 text-sm" defaultValue={q} name="q" placeholder="Search employees" /></div>
        <button className="focus-ring rounded-md bg-emerald-300 px-4 text-sm font-semibold text-emerald-950" type="submit">Search</button>
      </form>
      <div className="glass-panel mt-6 overflow-x-auto rounded-lg">
        {employees.length ? (
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="border-b border-white/8 text-xs text-slate-500"><tr><th className="px-5 py-4 font-medium">Employee</th><th className="px-5 py-4 font-medium">Username</th><th className="px-5 py-4 font-medium">Headquarters</th><th className="px-5 py-4 font-medium">Created</th><th className="px-5 py-4 font-medium">Last updated</th><th className="px-5 py-4 font-medium">Actions</th></tr></thead>
            <tbody className="divide-y divide-white/6">{employees.map((employee) => <tr key={employee.employee_id}><td className="px-5 py-4 font-medium text-white">{employeeName(employee)}</td><td className="px-5 py-4 font-mono text-xs text-emerald-200">{employee.username}</td><td className="px-5 py-4 text-slate-400">{employee.hq_id ? headquartersById.get(employee.hq_id) ?? "Unknown headquarters" : "Unassigned"}</td><td className="px-5 py-4 text-slate-400">{formatDateTime(employee.created_at)}</td><td className="px-5 py-4 text-slate-400">{formatDateTime(employee.updated_at)}</td><td className="px-5 py-4"><div className="flex items-center gap-3">{!removed ? <Link className="focus-ring flex items-center gap-2 text-xs text-emerald-300 hover:text-emerald-200" href={`/admin/employees?edit=${employee.employee_id}`}><Pencil className="size-3.5" />Edit</Link> : null}<form action={setEmployeeDeleted}><input name="employee_id" type="hidden" value={employee.employee_id} /><input name="isDeleted" type="hidden" value={removed ? "false" : "true"} /><button className={`focus-ring flex items-center gap-2 text-xs ${removed ? "text-emerald-300 hover:text-emerald-200" : "text-rose-300 hover:text-rose-200"}`} type="submit">{removed ? <RotateCcw className="size-3.5" /> : <Archive className="size-3.5" />}{removed ? "Restore" : "Remove"}</button></form></div></td></tr>)}</tbody>
          </table>
        ) : <EmptyState message={q ? "No employees match your search." : removed ? "No removed employees." : "No active employees found."} />}
      </div>
    </div>
  );
}