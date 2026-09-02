"use client";

import dynamic from "next/dynamic";
import { HQ_GEOFENCE_RADIUS_METERS } from "@/lib/geofence";
import type { Coordinates } from "@/lib/validations/location";

const InteractiveMap = dynamic(() => import("./interactive-map"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center bg-emerald-950/20 text-xs text-slate-400">Loading map...</div>,
});

type HeadquartersLocation = Coordinates & {
  id: number;
  name: string;
};

export function LocationPreview({ lat, lng, headquarters }: Coordinates & { headquarters?: HeadquartersLocation }) {
  return (
    <div className="h-64 overflow-hidden rounded-md border border-white/10">
      <InteractiveMap
        coordinates={{ lat, lng }}
        geofence={headquarters ? { lat: headquarters.lat, lng: headquarters.lng, radiusMeters: HQ_GEOFENCE_RADIUS_METERS } : undefined}
        headquarters={headquarters ? [headquarters] : []}
        onChange={() => undefined}
        readOnly
      />
    </div>
  );
}