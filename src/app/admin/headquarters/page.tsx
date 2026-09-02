import Link from "next/link";
import { Archive, Building2, Pencil, RotateCcw } from "lucide-react";
import { setHeadquartersDeleted } from "@/actions/headquarters";
import { CoordinateEditor } from "@/components/maps/coordinate-editor";
import { EmptyState } from "@/components/admin/empty-state";
import { getHeadquarters } from "@/lib/data/admin";
import { formatCoordinate } from "@/lib/format";

export default async function HeadquartersPage({ searchParams }: { searchParams: Promise<{ edit?: string; status?: string }> }) {
  const allHeadquarters = await getHeadquarters();
  const { edit, status = "active" } = await searchParams;
  const removed = status === "removed";
  const headquarters = allHeadquarters.filter((hq) => hq.isDeleted === removed);
  const activeHeadquarters = allHeadquarters.filter((hq) => !hq.isDeleted);
  const selectedId = Number(edit);
  const selectedHeadquarters = activeHeadquarters.find((hq) => hq.hq_id === selectedId);
  const markers = activeHeadquarters.map((hq) => ({
    id: hq.hq_id,
    name: hq.hq_name || "Unnamed headquarters",
    lat: hq.lat,
    lng: hq.long,
  }));
  const selectedMarker = markers.find((marker) => marker.id === selectedHeadquarters?.hq_id);
  return (
    <div className="rise-in">
      <div className="border-b border-white/8 pb-7">
        <p className="font-mono text-xs uppercase text-emerald-300">Location workspace</p>
        <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold text-white"><Building2 className="size-7 text-emerald-300" /> Headquarters</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Review existing offices and verify coordinates with OpenStreetMap.</p>
      </div>
      <div className="mt-6 flex gap-1 border-b border-white/8">
        <Link className={`focus-ring px-4 py-3 text-sm ${!removed ? "border-b-2 border-emerald-300 text-emerald-200" : "text-slate-500 hover:text-white"}`} href="/admin/headquarters">Active</Link>
        <Link className={`focus-ring px-4 py-3 text-sm ${removed ? "border-b-2 border-emerald-300 text-emerald-200" : "text-slate-500 hover:text-white"}`} href="/admin/headquarters?status=removed">Removed</Link>
      </div>
      <section className="mt-8 grid gap-6 xl:grid-cols-[22rem_1fr]">
        <div className="glass-panel overflow-hidden rounded-lg">
          <div className="border-b border-white/8 px-5 py-4"><h2 className="text-sm font-semibold text-white">Saved headquarters</h2></div>
          {headquarters.length ? <div className="divide-y divide-white/6">{headquarters.map((hq) => <div className={`flex items-start justify-between gap-3 p-5 ${hq.hq_id === selectedId ? "bg-emerald-300/6" : ""}`} key={hq.hq_id}><div><p className="font-medium text-white">{hq.hq_name || "Unnamed headquarters"}</p><p className="mt-2 font-mono text-xs text-slate-500">{formatCoordinate(hq.lat)}, {formatCoordinate(hq.long)}</p></div><div className="flex gap-1">{!removed ? <Link className="focus-ring grid size-9 place-items-center rounded-md text-slate-500 transition hover:bg-emerald-300/10 hover:text-emerald-300" href={`/admin/headquarters?edit=${hq.hq_id}`} title={`Edit ${hq.hq_name || "headquarters"}`}><Pencil className="size-4" /></Link> : null}<form action={setHeadquartersDeleted}><input name="hq_id" type="hidden" value={hq.hq_id} /><input name="isDeleted" type="hidden" value={removed ? "false" : "true"} /><button className={`focus-ring grid size-9 place-items-center rounded-md transition ${removed ? "text-emerald-300 hover:bg-emerald-300/10" : "text-slate-500 hover:bg-rose-300/10 hover:text-rose-300"}`} title={`${removed ? "Restore" : "Remove"} ${hq.hq_name || "headquarters"}`} type="submit">{removed ? <RotateCcw className="size-4" /> : <Archive className="size-4" />}</button></form></div></div>)}</div> : <EmptyState message={removed ? "No removed headquarters." : "No active headquarters configured."} />}
        </div>
        {!removed ? <CoordinateEditor headquarters={markers} key={selectedMarker?.id ?? "new"} selected={selectedMarker} /> : <div className="glass-panel grid min-h-72 place-items-center rounded-lg p-8 text-center"><div><RotateCcw className="mx-auto size-7 text-emerald-300" /><h2 className="mt-4 font-semibold text-white">Restore a headquarters</h2><p className="mt-2 text-sm text-slate-400">Restored offices return to the active list and map.</p></div></div>}
      </section>
    </div>
  );
}