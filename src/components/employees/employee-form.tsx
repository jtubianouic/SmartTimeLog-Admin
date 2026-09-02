"use client";

import { useActionState, useEffect, useRef } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { createEmployee, type EmployeeState } from "@/actions/employees";

const fields = [
  { name: "firstname", label: "First name", type: "text", autoComplete: "given-name" },
  { name: "lastname", label: "Last name", type: "text", autoComplete: "family-name" },
  { name: "username", label: "Username", type: "text", autoComplete: "username" },
  { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
  { name: "confirmPassword", label: "Confirm password", type: "password", autoComplete: "new-password" },
] as const;

export function EmployeeForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<EmployeeState, FormData>(createEmployee, {});

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      formRef.current?.reset();
    }
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  return (
    <details className="glass-panel mt-6 rounded-lg">
      <summary className="focus-ring flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-sm font-semibold text-white">
        <UserPlus className="size-4 text-emerald-300" /> Register employee
      </summary>
      <form action={action} className="grid gap-4 border-t border-white/8 p-5 sm:grid-cols-2" ref={formRef}>
        {fields.map((field) => (
          <label className={`block text-xs text-slate-400 ${field.name === "username" ? "sm:col-span-2" : ""}`} key={field.name}>
            {field.label}
            <input autoComplete={field.autoComplete} className="focus-ring mt-2 h-11 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm text-white" name={field.name} required type={field.type} />
            {state.errors?.[field.name]?.map((error) => <span className="mt-1 block text-xs text-rose-300" key={error}>{error}</span>)}
          </label>
        ))}
        <div className="flex items-center justify-between gap-4 sm:col-span-2">
          <p className="text-xs text-slate-500">Passwords are salted and hashed with bcrypt before storage.</p>
          <button className="focus-ring h-11 rounded-md bg-emerald-300 px-5 text-sm font-semibold text-emerald-950 disabled:opacity-60" disabled={pending} type="submit">{pending ? "Registering..." : "Register"}</button>
        </div>
      </form>
    </details>
  );
}