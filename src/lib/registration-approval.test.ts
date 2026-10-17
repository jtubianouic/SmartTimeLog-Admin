import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import {
  approveRegistrationWithToken,
  createRegistrationApprovalToken,
  getRegistrationApprovalStatus,
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

  it("loads review details without selecting the password", async () => {
    const token = createRegistrationApprovalToken(42, createdAt);
    const employeeQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          employee_id: 42,
          firstname: "Ada",
          lastname: "Lovelace",
          username: "ada.lovelace",
          hq_id: 7,
          created_at: createdAt,
          isPending: true,
          isDeleted: false,
        },
        error: null,
      }),
    };
    const hqQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { hq_name: "Main HQ" }, error: null }),
    };
    mocks.createAdminClient.mockReturnValue({
      from: vi.fn((table: string) => table === "employee" ? employeeQuery : hqQuery),
    });

    expect(await getRegistrationApprovalStatus(token)).toEqual({
      status: "pending",
      employee: {
        id: 42,
        name: "Ada Lovelace",
        username: "ada.lovelace",
        headquarters: "Main HQ",
        registeredAt: createdAt,
      },
    });
    expect(employeeQuery.select).toHaveBeenCalledWith("employee_id, firstname, lastname, username, hq_id, created_at, isPending, isDeleted");
    expect(hqQuery.select).toHaveBeenCalledWith("hq_name");
  });

  it("does not change the database when the link has expired", async () => {
    const token = createRegistrationApprovalToken(42, createdAt);
    vi.setSystemTime(new Date("2026-10-18T01:00:01Z"));

    expect(await getRegistrationApprovalStatus(token)).toEqual({ status: "invalid" });
    expect(await approveRegistrationWithToken(token)).toBe(false);
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });
});
