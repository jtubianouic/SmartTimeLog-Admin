import type { LucideIcon } from "lucide-react";
import { DatabaseZap } from "lucide-react";

export function SchemaPending({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="rise-in">
      <div className="border-b border-white/8 pb-7">
        <p className="font-mono text-xs uppercase text-emerald-300">SmartTimeLog records</p>
        <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold text-white"><Icon className="size-7 text-emerald-300" /> {title}</h1>
      </div>
      <div className="glass-panel mt-8 rounded-lg p-8 text-center sm:p-12">
        <DatabaseZap className="mx-auto size-7 text-cyan-300" />
        <h2 className="mt-5 text-lg font-semibold text-white">Schema access required</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">This view will connect only after the existing Supabase contract is generated. No table names or records are being assumed.</p>
      </div>
    </div>
  );
}