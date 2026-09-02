import Link from "next/link";
import { Building2, Pencil, Trash2 } from "lucide-react";
import { deleteHeadquarters } from "@/actions/headquarters";
import { CoordinateEditor } from "@/components/maps/coordinate-editor";
import { EmptyState } from "@/components/admin/empty-state";
import { getHeadquarters } from "@/lib/data/admin";
import { formatCoordinate } from "@/lib/format";

export default async function HeadquartersPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const headquarters = await getHeadquarters();
  const { edit } = await searchParams;
  const selectedId = Number(edit);
  const selectedHeadquarters = headquarters.find((hq) => hq.hq_id === selectedId);
  const markers = headquarters.map((hq) => ({
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
      <section className="mt-8 grid gap-6 xl:grid-cols-[22rem_1fr]">
        <div className="glass-panel overflow-hidden rounded-lg">
          <div className="border-b border-white/8 px-5 py-4"><h2 className="text-sm font-semibold text-white">Saved headquarters</h2></div>
          {headquarters.length ? <div className="divide-y divide-white/6">{headquarters.map((hq) => <div className={`flex items-start justify-between gap-3 p-5 ${hq.hq_id === selectedId ? "bg-emerald-300/6" : ""}`} key={hq.hq_id}><div><p className="font-medium text-white">{hq.hq_name || "Unnamed headquarters"}</p><p className="mt-2 font-mono text-xs text-slate-500">{formatCoordinate(hq.lat)}, {formatCoordinate(hq.long)}</p></div><div className="flex gap-1"><Link className="focus-ring grid size-9 place-items-center rounded-md text-slate-500 transition hover:bg-emerald-300/10 hover:text-emerald-300" href={`/admin/headquarters?edit=${hq.hq_id}`} title={`Edit ${hq.hq_name || "headquarters"}`}><Pencil className="size-4" /></Link><form action={deleteHeadquarters}><input name="hq_id" type="hidden" value={hq.hq_id} /><button className="focus-ring grid size-9 place-items-center rounded-md text-slate-500 transition hover:bg-rose-300/10 hover:text-rose-300" title={`Delete ${hq.hq_name || "headquarters"}`} type="submit"><Trash2 className="size-4" /></button></form></div></div>)}</div> : <EmptyState message="No headquarters configured." />}
        </div>
        <CoordinateEditor headquarters={markers} key={selectedMarker?.id ?? "new"} selected={selectedMarker} />
      </section>
    </div>
  );
}