import { KeyRound, Settings, ShieldCheck, UserRound } from "lucide-react";
import { PageHeading } from "@/components/admin/page-heading";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function SettingsPage() {
  const user = await requireAdmin();
  return (
    <div className="rise-in">
      <PageHeading eyebrow="Account and security" icon={Settings} title="Settings" description="Review the current administrator session and configured integrations." />
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="glass-panel rounded-lg p-6">
          <UserRound className="size-5 text-emerald-300" />
          <h2 className="mt-6 text-lg font-semibold text-white">Administrator account</h2>
          <dl className="mt-5 space-y-4 text-sm"><div><dt className="text-xs text-slate-500">Email</dt><dd className="mt-1 text-slate-200">{user.email ?? "Not available"}</dd></div><div><dt className="text-xs text-slate-500">Role</dt><dd className="mt-1 font-mono text-emerald-300">{String(user.app_metadata.role)}</dd></div></dl>
        </section>
        <section className="glass-panel rounded-lg p-6">
          <ShieldCheck className="size-5 text-cyan-300" />
          <h2 className="mt-6 text-lg font-semibold text-white">Security status</h2>
          <div className="mt-5 space-y-3 text-sm"><p className="flex items-center gap-2 text-slate-300"><span className="size-2 rounded-full bg-emerald-300" /> Supabase session verified</p><p className="flex items-center gap-2 text-slate-300"><span className="size-2 rounded-full bg-emerald-300" /> Administrator claim verified</p><p className="flex items-center gap-2 text-slate-300"><KeyRound className="size-4 text-slate-500" /> Server secrets remain private</p></div>
        </section>
      </div>
    </div>
  );
}