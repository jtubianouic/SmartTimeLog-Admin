import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const tokenLifetimeMs = 30 * 60 * 1000;
const registrationTokenId = 1;

export async function getRegistrationAccessToken() {
  const secret = process.env.REGISTRATION_TOKEN_SECRET;
  if (!secret) throw new Error("Registration token secret is not configured.");

  const supabase = createAdminClient();
  const { data: current, error: readError } = await supabase
    .from("registration_access_token")
    .select("id, token, expiration_date")
    .eq("id", registrationTokenId)
    .maybeSingle();
  if (readError) throw new Error("Unable to load the registration token.");

  if (current && Date.parse(current.expiration_date) > Date.now()) {
    return { token: current.token, expiresAt: current.expiration_date };
  }

  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.parse(createdAt) + tokenLifetimeMs).toISOString();
  const token = createHash("sha256").update(secret + createdAt).digest("hex");
  const values = { token, expiration_date: expiresAt, created_at: createdAt, updated_at: createdAt };

  if (current) {
    // Only rotate the value we read. Another open admin page may have refreshed it already.
    const { data, error } = await supabase
      .from("registration_access_token")
      .update(values)
      .eq("id", current.id)
      .eq("token", current.token)
      .select("token, expiration_date")
      .maybeSingle();
    if (error) throw new Error("Unable to refresh the registration token.");
    if (data) return { token: data.token, expiresAt: data.expiration_date };

    const { data: refreshed, error: refreshedError } = await supabase
      .from("registration_access_token")
      .select("token, expiration_date")
      .eq("id", current.id)
      .single();
    if (refreshedError) throw new Error("Unable to load the refreshed registration token.");
    return { token: refreshed.token, expiresAt: refreshed.expiration_date };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("registration_access_token")
    .insert({ ...values, id: registrationTokenId })
    .select("token, expiration_date")
    .single();
  if (insertError) {
    // A concurrent request may have created the singleton row first.
    if (insertError.code !== "23505") throw new Error("Unable to create the registration token.");
    const { data: concurrent, error: concurrentError } = await supabase
      .from("registration_access_token")
      .select("token, expiration_date")
      .eq("id", registrationTokenId)
      .single();
    if (concurrentError) throw new Error("Unable to load the registration token.");
    return { token: concurrent.token, expiresAt: concurrent.expiration_date };
  }
  return { token: inserted.token, expiresAt: inserted.expiration_date };
}

export async function isValidRegistrationAccessToken(candidate: string) {
  const secret = process.env.REGISTRATION_TOKEN_SECRET;
  if (!secret) throw new Error("Registration token secret is not configured.");

  const { data, error } = await createAdminClient()
    .from("registration_access_token")
    .select("token, expiration_date, created_at")
    .eq("id", registrationTokenId)
    .maybeSingle();
  if (error) throw new Error("Unable to validate the registration token.");
  if (!data?.created_at || Date.parse(data.expiration_date) <= Date.now()) return false;

  const expected = createHash("sha256").update(secret + new Date(data.created_at).toISOString()).digest();
  const stored = Buffer.from(data.token, "hex");
  const submitted = Buffer.from(candidate, "hex");
  return stored.length === expected.length && submitted.length === expected.length
    && timingSafeEqual(stored, expected) && timingSafeEqual(submitted, expected);
}
