import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  if (data.user.app_metadata.role !== "admin") {
    await supabase.auth.signOut();
    redirect("/login?error=unauthorized");
  }

  return data.user;
}