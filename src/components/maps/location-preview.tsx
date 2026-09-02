"use client";

import dynamic from "next/dynamic";
import type { Coordinates } from "@/lib/validations/location";

const InteractiveMap = dynamic(() => import("./interactive-map"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center bg-emerald-950/20 text-xs text-slate-400">Loading map...</div>,
});

export function LocationPreview({ lat, lng }: Coordinates) {
  return (
    <div className="h-64 overflow-hidden rounded-md border border-white/10">
      <InteractiveMap coordinates={{ lat, lng }} onChange={() => undefined} readOnly />
    </div>
  );
}