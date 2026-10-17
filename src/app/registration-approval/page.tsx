import type { Metadata } from "next";
import { Check, ShieldCheck } from "lucide-react";
import { approveRegistrationFromEmail } from "@/actions/registration-approval";
import { BrandIcon } from "@/components/brand-icon";
import { getRegistrationApprovalStatus } from "@/lib/registration-approval";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Approve employee registration",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function RegistrationApprovalPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; result?: string }>;
}) {
  const { token, result } = await searchParams;
  let status: "approved" | "pending" | "invalid" | "unavailable" = "invalid";
  if (result === "approved") status = "approved";
  else if (result === "unavailable") status = "unavailable";
  else if (token) {
    try {
      status = await getRegistrationApprovalStatus(token);
    } catch (error) {
      console.error("Registration approval check failed:", error);
      status = "unavailable";
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="glass-panel rise-in w-full max-w-md rounded-lg p-6 sm:p-9">
        <div className="flex items-center gap-3">
          <BrandIcon className="size-8 object-contain" priority />
          <span className="font-semibold text-white">SmartTimeLog</span>
        </div>
        <span className="mt-10 grid size-10 place-items-center rounded-md bg-emerald-300/10">
          {status === "approved" ? <Check className="size-5 text-emerald-300" /> : <ShieldCheck className="size-5 text-emerald-300" />}
        </span>
        <h1 className="mt-6 text-2xl font-semibold text-white">
          {status === "approved" ? "Registration approved" : status === "pending" ? "Approve employee registration" : "Approval link unavailable"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {status === "approved"
            ? "The employee is now active and can sign in."
            : status === "pending"
              ? "A new employee registered with the SmartTimeLog QR code. Approve this registration to activate their account."
              : "This link has expired, was already used, or the registration is no longer pending. Check the Pending tab in the admin dashboard if needed."}
        </p>
        {status === "pending" ? (
          <form action={approveRegistrationFromEmail} className="mt-8">
            <input name="token" type="hidden" value={token} />
            <button className="focus-ring flex h-12 w-full items-center justify-center gap-2 rounded-md bg-emerald-300 px-5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200" type="submit">
              <Check className="size-4" /> Approve employee
            </button>
          </form>
        ) : null}
      </div>
    </main>
  );
}
