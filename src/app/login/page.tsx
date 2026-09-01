import type { Metadata } from "next";
import { Activity, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Admin sign in" };

export default function LoginPage() {
  return (
    <main className="relative grid min-h-screen overflow-hidden lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden min-h-screen border-r border-white/8 px-14 py-12 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md border border-emerald-200/20 bg-emerald-300/10">
            <Activity className="size-5 text-emerald-300" />
          </span>
          <span className="font-semibold">SmartTimeLog</span>
        </div>
        <div className="max-w-xl rise-in">
          <p className="font-mono text-xs uppercase text-emerald-300">Operations console</p>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.12] text-white">
            Time, place, and progress in one clear view.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
            Manage attendance operations, workplace locations, and daily work records through one secure control plane.
          </p>
        </div>
        <p className="font-mono text-xs text-slate-600">SMARTTIMELOG / ADMIN ACCESS</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10">
        <div className="glass-panel rise-in w-full max-w-md rounded-lg p-6 sm:p-9">
          <div className="flex items-center gap-3 lg:hidden">
            <Activity className="size-5 text-emerald-300" />
            <span className="font-semibold">SmartTimeLog</span>
          </div>
          <div className="mt-12 lg:mt-0">
            <span className="grid size-10 place-items-center rounded-md bg-emerald-300/10">
              <ShieldCheck className="size-5 text-emerald-300" />
            </span>
            <h2 className="mt-6 text-2xl font-semibold text-white">Admin sign in</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Use an account with the SmartTimeLog administrator role.
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}