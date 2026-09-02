"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { Pencil, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { createEmployee, type EmployeeState } from "@/actions/employees";

const fields = [
  { name: "firstname", label: "First name", type: "text", autoComplete: "given-name" },
  { name: "lastname", label: "Last name", type: "text", autoComplete: "family-name" },
  { name: "username", label: "Username", type: "text", autoComplete: "username" },
  { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
  { name: "confirmPassword", label: "Confirm password", type: "password", autoComplete: "new-password" },
] as const;

type HeadquartersOption = {
  hq_id: number;
  hq_name: string | null;
};

type EditableEmployee = {
  employee_id: number;
  firstname: string | null;
  lastname: string | null;
  username: string;
  hq_id: number | null;
};

export function EmployeeForm({ headquarters, selected }: { headquarters: HeadquartersOption[]; selected?: EditableEmployee }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<EmployeeState, FormData>(createEmployee, {});

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      if (!selected) formRef.current?.reset();
    }
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state, selected]);

  return (
    <details className="glass-panel mt-6 rounded-lg" open={selected ? true : undefined}>
      <summary className="focus-ring flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-sm font-semibold text-white">
        {selected ? <Pencil className="size-4 text-emerald-300" /> : <UserPlus className="size-4 text-emerald-300" />} {selected ? "Edit employee" : "Register employee"}
      </summary>
      <form action={action} className="grid gap-4 border-t border-white/8 p-5 sm:grid-cols-2" ref={formRef}>
        {selected ? <input name="employee_id" type="hidden" value={selected.employee_id} /> : null}
        {fields.map((field) => (
          <label className={`block text-xs text-slate-400 ${field.name === "username" ? "sm:col-span-2" : ""}`} key={field.name}>
            {field.label}
            <input autoComplete={field.autoComplete} className="focus-ring mt-2 h-11 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm text-white" defaultValue={field.name === "firstname" ? selected?.firstname ?? "" : field.name === "lastname" ? selected?.lastname ?? "" : field.name === "username" ? selected?.username ?? "" : ""} name={field.name} required={!selected || (field.name !== "password" && field.name !== "confirmPassword")} type={field.type} />
            {state.errors?.[field.name]?.map((error) => <span className="mt-1 block text-xs text-rose-300" key={error}>{error}</span>)}
          </label>
        ))}
        <label className="block text-xs text-slate-400 sm:col-span-2">
          Assigned headquarters
          <select className="focus-ring mt-2 h-11 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm text-white" name="hq_id" required defaultValue={selected?.hq_id ?? ""}>
            <option disabled value="">Select headquarters</option>
            {headquarters.map((hq) => <option key={hq.hq_id} value={hq.hq_id}>{hq.hq_name || `Headquarters ${hq.hq_id}`}</option>)}
          </select>
          {state.errors?.hq_id?.map((error) => <span className="mt-1 block text-xs text-rose-300" key={error}>{error}</span>)}
        </label>
        <div className="flex items-center justify-between gap-4 sm:col-span-2">
          <p className="text-xs text-slate-500">{selected ? "Leave password fields blank to keep the current password." : "Passwords are salted and hashed with bcrypt before storage."}</p>
          <div className="flex gap-2">
            {selected ? <Link className="focus-ring flex h-11 items-center gap-2 rounded-md border border-white/10 px-4 text-sm text-slate-300 hover:text-white" href="/admin/employees"><X className="size-4" />Cancel</Link> : null}
            <button className="focus-ring h-11 rounded-md bg-emerald-300 px-5 text-sm font-semibold text-emerald-950 disabled:opacity-60" disabled={pending} type="submit">{pending ? "Saving..." : selected ? "Update" : "Register"}</button>
          </div>
        </div>
      </form>
    </details>
  );
}