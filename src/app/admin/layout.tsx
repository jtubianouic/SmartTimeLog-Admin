import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen">
      <AdminNav email={user.email ?? "Administrator"} />
      <main className="min-h-screen px-4 pb-10 pt-24 sm:px-6 lg:ml-64 lg:px-10 lg:pt-10">
        <div className="mx-auto max-w-[94rem]">{children}</div>
      </main>
    </div>
  );
}