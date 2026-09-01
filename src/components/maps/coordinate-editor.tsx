"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { MapPin } from "lucide-react";
import { coordinatesSchema, type Coordinates } from "@/lib/validations/location";

const InteractiveMap = dynamic(() => import("./interactive-map"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center bg-emerald-950/20 text-sm text-slate-400">Loading map...</div>,
});

const initialCoordinates: Coordinates = { lat: 7.0731, lng: 125.6128 };

export function CoordinateEditor() {
  const [coordinates, setCoordinates] = useState(initialCoordinates);

  function updateCoordinate(field: keyof Coordinates, value: string) {
    const candidate = { ...coordinates, [field]: Number(value) };
    if (coordinatesSchema.safeParse(candidate).success) {
      setCoordinates(candidate);
    }
  }

  return (
    <div className="grid overflow-hidden rounded-lg border border-white/10 bg-[#091817]/80 lg:grid-cols-[20rem_1fr]">
      <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2 text-sm font-semibold text-white"><MapPin className="size-4 text-emerald-300" /> Selected location</div>
        <p className="mt-2 text-xs leading-5 text-slate-500">Click the map, drag the marker, or enter coordinates.</p>
        <div className="mt-6 space-y-4">
          <label className="block text-xs text-slate-400">
            Latitude
            <input
              className="focus-ring mt-2 h-11 w-full rounded-md border border-white/10 bg-black/20 px-3 font-mono text-sm text-white"
              max={90}
              min={-90}
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
              onChange={(event) => updateCoordinate("lng", event.target.value)}
              step="any"
              type="number"
              value={coordinates.lng}
            />
          </label>
        </div>
      </div>
      <div className="h-[25rem] min-w-0 lg:h-[34rem]">
        <InteractiveMap coordinates={coordinates} onChange={setCoordinates} />
      </div>
    </div>
  );
}