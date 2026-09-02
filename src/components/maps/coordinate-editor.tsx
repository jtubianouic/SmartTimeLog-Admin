"use client";

import dynamic from "next/dynamic";
import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Save, X } from "lucide-react";
import { toast } from "sonner";
import { createHeadquarters, type HeadquartersState } from "@/actions/headquarters";
import { coordinatesSchema, type Coordinates } from "@/lib/validations/location";
import type { HeadquartersMarker } from "./interactive-map";

const InteractiveMap = dynamic(() => import("./interactive-map"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center bg-emerald-950/20 text-sm text-slate-400">Loading map...</div>,
});

const initialCoordinates: Coordinates = { lat: 7.0731, lng: 125.6128 };

export function CoordinateEditor({
  headquarters,
  selected,
}: {
  headquarters: HeadquartersMarker[];
  selected?: HeadquartersMarker;
}) {
  const [coordinates, setCoordinates] = useState<Coordinates>(
    selected ? { lat: selected.lat, lng: selected.lng } : headquarters[0] ? { lat: headquarters[0].lat, lng: headquarters[0].lng } : initialCoordinates,
  );
  const [name, setName] = useState(selected?.name ?? "");
  const [state, action, pending] = useActionState<HeadquartersState, FormData>(createHeadquarters, {});

  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
    if (state.status === "error") toast.error(state.message);
  }, [state]);

  function updateCoordinate(field: keyof Coordinates, value: string) {
    const candidate = { ...coordinates, [field]: Number(value) };
    if (coordinatesSchema.safeParse(candidate).success) {
      setCoordinates(candidate);
    }
  }

  return (
    <form action={action} className="grid overflow-hidden rounded-lg border border-white/10 bg-[#091817]/80 lg:grid-cols-[20rem_1fr]">
      <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white"><MapPin className="size-4 text-emerald-300" /> {selected ? "Edit headquarters" : "New headquarters"}</div>
          {selected ? <Link className="focus-ring grid size-8 place-items-center rounded-md text-slate-500 hover:bg-white/5 hover:text-white" href="/admin/headquarters" title="Cancel editing"><X className="size-4" /></Link> : null}
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">Click the map, drag the marker, or enter coordinates.</p>
        {selected ? <input name="hq_id" type="hidden" value={selected.id} /> : null}
        <div className="mt-6 space-y-4">
          <label className="block text-xs text-slate-400">
            Headquarters name
            <input className="focus-ring mt-2 h-11 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm text-white" maxLength={120} name="hq_name" onChange={(event) => setName(event.target.value)} placeholder="Main office" required value={name} />
          </label>
          <label className="block text-xs text-slate-400">
            Latitude
            <input
              className="focus-ring mt-2 h-11 w-full rounded-md border border-white/10 bg-black/20 px-3 font-mono text-sm text-white"
              max={90}
              min={-90}
              name="lat"
              onChange={(event) => updateCoordinate("lat", event.target.value)}
              step="any"
              type="number"
              value={coordinates.lat}
            />
          </label>
          <label className="block text-xs text-slate-400">
            Longitude
            <input
              className="focus-ring mt-2 h-11 w-full rounded-md border border-white/10 bg-black/20 px-3 font-mono text-sm text-white"
              max={180}
              min={-180}
              name="long"
              onChange={(event) => updateCoordinate("lng", event.target.value)}
              step="any"
              type="number"
              value={coordinates.lng}
            />
          </label>
          <button className="focus-ring flex h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald-300 text-sm font-semibold text-emerald-950 disabled:opacity-60" disabled={pending} type="submit"><Save className="size-4" />{pending ? "Saving..." : selected ? "Update headquarters" : "Save headquarters"}</button>
        </div>
      </div>
      <div className="h-[25rem] min-w-0 lg:h-[34rem]">
        <InteractiveMap coordinates={coordinates} headquarters={headquarters} onChange={setCoordinates} selectedId={selected?.id} selectedName={name || undefined} />
      </div>
    </form>
  );
}