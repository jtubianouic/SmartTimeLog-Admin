import type { LucideIcon } from "lucide-react";

export function PageHeading({
  eyebrow,
  icon: Icon,
  title,
  description,
}: {
  eyebrow: string;
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b border-white/8 pb-7">
      <p className="font-mono text-xs uppercase text-emerald-300">{eyebrow}</p>
      <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold text-white">
        <Icon className="size-7 text-emerald-300" /> {title}
      </h1>
      {description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{description}</p> : null}
    </div>
  );
}