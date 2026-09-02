"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="glass-panel mx-auto mt-20 max-w-xl rounded-lg p-8 text-center">
      <AlertTriangle className="mx-auto size-7 text-amber-300" />
      <h1 className="mt-5 text-xl font-semibold text-white">Unable to load this information</h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">Your session may not have permission under the existing Supabase RLS policies. Please try again.</p>
      <button className="focus-ring mx-auto mt-6 flex h-11 items-center gap-2 rounded-md bg-emerald-300 px-4 text-sm font-semibold text-emerald-950" onClick={reset} type="button"><RefreshCw className="size-4" /> Retry</button>
    </div>
  );
}