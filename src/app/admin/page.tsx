import { Database, Radio, ShieldCheck } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="rise-in">
      <div className="flex flex-col gap-3 border-b border-white/8 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase text-emerald-300">Operations overview</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-200"><Radio className="size-3" /> Secure session active</div>
      </div>
      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="glass-panel rounded-lg p-6">
          <ShieldCheck className="size-5 text-emerald-300" />
          <h2 className="mt-8 text-lg font-semibold">Admin access verified</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">This route requires a valid Supabase session and administrator claim.</p>
        </div>
        <div className="glass-panel rounded-lg p-6 lg:col-span-2">
          <Database className="size-5 text-cyan-300" />
          <h2 className="mt-8 text-lg font-semibold">Database contract pending</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Generate the linked Supabase database types to unlock real metrics and management views. No mock operational data is shown.</p>
        </div>
      </section>
    </div>
  );
}