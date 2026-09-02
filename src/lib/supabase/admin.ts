import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSupabaseEnvironment } from "./env";

export function createAdminClient() {
  const { url } = getSupabaseEnvironment();
  const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serverKey) {
    throw new Error("Supabase server credentials are not configured.");
  }

  return createClient<Database>(url, serverKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}