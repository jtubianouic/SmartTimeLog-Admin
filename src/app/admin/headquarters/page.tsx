import { Building2 } from "lucide-react";
import { CoordinateEditor } from "@/components/maps/coordinate-editor";

export default function HeadquartersPage() {
  return (
    <div className="rise-in">
      <div className="border-b border-white/8 pb-7">
        <p className="font-mono text-xs uppercase text-emerald-300">Location workspace</p>
        <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold text-white"><Building2 className="size-7 text-emerald-300" /> Headquarters</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Select and verify coordinates with OpenStreetMap. Database saving activates after schema synchronization.</p>
      </div>
      <section className="mt-8">
        <CoordinateEditor />
      </section>
    </div>
  );
}