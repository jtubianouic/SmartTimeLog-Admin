import { FileText, Sparkles } from "lucide-react";
import { regenerateSummary } from "@/actions/summaries";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeading } from "@/components/admin/page-heading";
import { employeeName, getSummaries } from "@/lib/data/admin";
import { formatDateTime } from "@/lib/format";

export default async function SummariesPage() {
  const summaries = await getSummaries();
  return (
    <div className="rise-in">
      <PageHeading eyebrow="Daily work review" icon={FileText} title="Work summaries" description="Raw employee input is preserved alongside its generated professional summary." />
      <div className="mt-6 grid gap-4">
        {summaries.length ? summaries.map((summary) => (
          <article className="glass-panel rounded-lg p-5 sm:p-6" key={summary.log_id}>
            <div className="flex flex-col gap-2 border-b border-white/8 pb-4 sm:flex-row sm:items-center sm:justify-between"><h2 className="font-medium text-white">{employeeName(summary.timelog?.employee ?? null)}</h2><time className="font-mono text-xs text-slate-500">{formatDateTime(summary.timelog?.timestamp ?? summary.created_at)}</time></div>
            <div className="mt-5 grid gap-5 lg:grid-cols-2"><div><h3 className="font-mono text-[10px] uppercase text-slate-500">Employee input</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{summary.employee_input || "No input provided."}</p></div><div><div className="flex items-center justify-between gap-3"><h3 className="font-mono text-[10px] uppercase text-emerald-400">AI summary</h3>{summary.employee_input ? <form action={regenerateSummary}><input name="log_id" type="hidden" value={summary.log_id} /><button className="focus-ring flex items-center gap-1.5 text-xs text-emerald-300 hover:text-emerald-200" type="submit"><Sparkles className="size-3" /> Generate</button></form> : null}</div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-emerald-50">{summary.employee_ai_summary || "Not generated yet."}</p></div></div>
          </article>
        )) : <div className="glass-panel rounded-lg"><EmptyState message="No work summaries found." /></div>}
      </div>
    </div>
  );
}