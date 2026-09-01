"use client";

import { useActionState } from "react";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { login, type LoginState } from "@/actions/auth";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="mt-9 space-y-5" noValidate>
      <div>
        <label className="mb-2 block text-sm text-emerald-50" htmlFor="email">
          Admin email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-emerald-200/55" />
          <input
            autoComplete="email"
            className="focus-ring h-12 w-full rounded-md border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white placeholder:text-slate-500"
            id="email"
            name="email"
            placeholder="admin@company.com"
            type="email"
          />
        </div>
        {state.errors?.email?.map((error) => (
          <p className="mt-2 text-xs text-rose-300" key={error}>{error}</p>
        ))}
      </div>

      <div>
        <label className="mb-2 block text-sm text-emerald-50" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-emerald-200/55" />
          <input
            autoComplete="current-password"
            className="focus-ring h-12 w-full rounded-md border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white"
            id="password"
            name="password"
            type="password"
          />
        </div>
        {state.errors?.password?.map((error) => (
          <p className="mt-2 text-xs text-rose-300" key={error}>{error}</p>
        ))}
      </div>

      {state.message ? (
        <p className="rounded-md border border-rose-300/15 bg-rose-400/8 px-4 py-3 text-sm text-rose-200" role="alert">
          {state.message}
        </p>
      ) : null}

      <button
        className="focus-ring flex h-12 w-full items-center justify-center gap-2 rounded-md bg-emerald-300 px-5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 disabled:cursor-wait disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing in..." : "Enter dashboard"}
        {!pending && <ArrowRight className="size-4" />}
      </button>
    </form>
  );
}