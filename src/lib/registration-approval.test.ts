import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import {
  approveRegistrationWithToken,
  createRegistrationApprovalToken,
  readRegistrationApprovalToken,
} from "./registration-approval";

const createdAt = "2026-10-17T00:00:00Z";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-17T01:00:00Z"));
  vi.stubEnv("REGISTRATION_TOKEN_SECRET", "test-registration-secret");
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("email registration approval", () => {
  it("rejects altered and expired links", () => {
    const token = createRegistrationApprovalToken(42, createdAt);
    expect(readRegistrationApprovalToken(token)).toMatchObject({ employeeId: 42, createdAt });
    expect(readRegistrationApprovalToken(`${token.slice(0, -2)}xx`)).toBeNull();

    vi.setSystemTime(new Date("2026-10-18T01:00:01Z"));
    expect(readRegistrationApprovalToken(token)).toBeNull();
  });

  it("approves only the matching pending employee, once", async () => {
    const token = createRegistrationApprovalToken(42, createdAt);
    const query = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn()
        .mockResolvedValueOnce({ data: { employee_id: 42 }, error: null })
        .mockResolvedValueOnce({ data: null, error: null }),
    };
    mocks.createAdminClient.mockReturnValue({ from: vi.fn().mockReturnValue(query) });

    expect(await approveRegistrationWithToken(token)).toBe(true);
    expect(await approveRegistrationWithToken(token)).toBe(false);
    expect(query.update).toHaveBeenCalledWith({ isPending: false });
    expect(query.eq).toHaveBeenCalledWith("employee_id", 42);
    expect(query.eq).toHaveBeenCalledWith("created_at", createdAt);
    expect(query.eq).toHaveBeenCalledWith("isPending", true);
    expect(query.eq).toHaveBeenCalledWith("isDeleted", false);
  });
});
