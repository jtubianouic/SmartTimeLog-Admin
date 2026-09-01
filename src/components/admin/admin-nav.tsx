"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Activity, Building2, Clock3, FileText, LayoutDashboard, LogOut, Menu, Settings, Users, X } from "lucide-react";
import { logout } from "@/actions/auth";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/employees", label: "Employees", icon: Users },
  { href: "/admin/headquarters", label: "Headquarters", icon: Building2 },
  { href: "/admin/timelogs", label: "Timelogs", icon: Clock3 },
  { href: "/admin/summaries", label: "Work summaries", icon: FileText },
];

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navigation = (
    <>
      <div className="flex h-20 items-center justify-between border-b border-white/8 px-5">
        <Link className="focus-ring flex items-center gap-3" href="/admin">
          <span className="grid size-9 place-items-center rounded-md border border-emerald-200/20 bg-emerald-300/10">
            <Activity className="size-5 text-emerald-300" />
          </span>
          <span className="font-semibold text-white">SmartTimeLog</span>
        </Link>
        <button className="focus-ring lg:hidden" onClick={() => setOpen(false)} title="Close navigation" type="button"><X className="size-5" /></button>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-6" aria-label="Admin navigation">
        {links.map(({ href, icon: Icon, label }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              className={`focus-ring flex h-11 items-center gap-3 rounded-md px-3 text-sm transition ${active ? "border border-emerald-200/15 bg-emerald-300/10 text-emerald-200" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
              href={href}
              key={href}
              onClick={() => setOpen(false)}
            >
              <Icon className="size-4" />{label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/8 p-3">
        <Link className="focus-ring flex h-11 items-center gap-3 rounded-md px-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white" href="/admin/settings"><Settings className="size-4" /> Settings</Link>
        <form action={logout}><button className="focus-ring flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white" type="submit"><LogOut className="size-4" /> Logout</button></form>
        <p className="truncate px-3 pt-3 font-mono text-[10px] text-slate-600">{email}</p>
      </div>
    </>
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-white/8 bg-[#07100f]/90 px-4 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2 font-semibold"><Activity className="size-5 text-emerald-300" /> SmartTimeLog</div>
        <button className="focus-ring grid size-10 place-items-center" onClick={() => setOpen(true)} title="Open navigation" type="button"><Menu className="size-5" /></button>
      </header>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/8 bg-[#081312]/92 backdrop-blur-2xl lg:flex lg:flex-col">{navigation}</aside>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close navigation" className="absolute inset-0 bg-black/65" onClick={() => setOpen(false)} type="button" />
          <aside className="absolute inset-y-0 left-0 flex w-[min(84vw,19rem)] flex-col bg-[#081312] shadow-2xl">{navigation}</aside>
        </div>
      ) : null}
    </>
  );
}