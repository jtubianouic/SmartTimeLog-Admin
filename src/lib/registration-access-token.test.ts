import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({
  row: null as null | { token: string; created_at: string; expiration_date: string },
  error: null as null | { message: string },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: database.row, error: database.error }) }),
      }),
    }),
  }),
}));

import { isValidRegistrationAccessToken } from "./registration-access-token";

beforeEach(() => {
  vi.stubEnv("REGISTRATION_TOKEN_SECRET", "registration-test-secret");
  database.row = null;
  database.error = null;
});

describe("registration token validation", () => {
  it("accepts the stored SHA-256 token while it is valid", async () => {
    const created_at = new Date(Date.now() - 60_000).toISOString();
    const token = createHash("sha256").update(`registration-test-secret${created_at}`).digest("hex");
    database.row = { token, created_at, expiration_date: new Date(Date.now() + 60_000).toISOString() };

    await expect(isValidRegistrationAccessToken(token)).resolves.toBe(true);
    await expect(isValidRegistrationAccessToken("0".repeat(64))).resolves.toBe(false);
  });

  it("rejects an expired token even when its hash matches", async () => {
    const created_at = new Date(Date.now() - 31 * 60_000).toISOString();
    const token = createHash("sha256").update(`registration-test-secret${created_at}`).digest("hex");
    database.row = { token, created_at, expiration_date: new Date(Date.now() - 60_000).toISOString() };

    await expect(isValidRegistrationAccessToken(token)).resolves.toBe(false);
  });
});
