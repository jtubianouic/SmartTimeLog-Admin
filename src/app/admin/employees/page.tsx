import { Search, Users } from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeading } from "@/components/admin/page-heading";
import { EmployeeForm } from "@/components/employees/employee-form";
import { employeeName, getEmployees } from "@/lib/data/admin";
import { formatDateTime } from "@/lib/format";

export default async function EmployeesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const employees = await getEmployees(q);

  return (
    <div className="rise-in">
      <PageHeading eyebrow="People directory" icon={Users} title="Employees" description="Employee credentials are never selected or displayed in this dashboard." />
      <EmployeeForm />
      <form className="mt-6 flex max-w-md gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" /><input className="focus-ring h-11 w-full rounded-md border border-white/10 bg-black/20 pl-10 pr-3 text-sm" defaultValue={q} name="q" placeholder="Search employees" /></div>
        <button className="focus-ring rounded-md bg-emerald-300 px-4 text-sm font-semibold text-emerald-950" type="submit">Search</button>
      </form>
      <div className="glass-panel mt-6 overflow-x-auto rounded-lg">
        {employees.length ? (
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="border-b border-white/8 text-xs text-slate-500"><tr><th className="px-5 py-4 font-medium">Employee</th><th className="px-5 py-4 font-medium">Username</th><th className="px-5 py-4 font-medium">Created</th><th className="px-5 py-4 font-medium">Last updated</th></tr></thead>
            <tbody className="divide-y divide-white/6">{employees.map((employee) => <tr key={employee.employee_id}><td className="px-5 py-4 font-medium text-white">{employeeName(employee)}</td><td className="px-5 py-4 font-mono text-xs text-emerald-200">{employee.username}</td><td className="px-5 py-4 text-slate-400">{formatDateTime(employee.created_at)}</td><td className="px-5 py-4 text-slate-400">{formatDateTime(employee.updated_at)}</td></tr>)}</tbody>
          </table>
        ) : <EmptyState message={q ? "No employees match your search." : "No employees found."} />}
      </div>
    </div>
  );
}