import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  compare: vi.fn(),
  hash: vi.fn(),
  issueMobileToken: vi.fn(),
  createAdminClient: vi.fn(),
  employee: null as null | Record<string, unknown>,
}));

vi.mock("server-only", () => ({}));
vi.mock("bcryptjs", () => ({ compare: mocks.compare, hash: mocks.hash }));
vi.mock("@/lib/mobile-api/auth", () => ({
  issueMobileToken: mocks.issueMobileToken,
  mobileTokenLifetimeSeconds: 43_200,
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import { POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.compare.mockResolvedValue(true);
  mocks.hash.mockResolvedValue("dummy-hash");
  mocks.issueMobileToken.mockResolvedValue("mobile-jwt");
  mocks.createAdminClient.mockReturnValue({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: mocks.employee, error: null }) }) }),
    }),
  });
  mocks.employee = {
    employee_id: 42,
    username: "ada.lovelace",
    password: "stored-bcrypt-hash",
    firstname: "Ada",
    lastname: "Lovelace",
    hq_id: 1,
    isDeleted: false,
    isPending: true,
    headquarters: { hq_id: 1, hq_name: "Main", lat: 1, long: 2 },
  };
});

function request() {
  return new Request("http://localhost/api/mobile/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "ada.lovelace", plainPassword: "correct-password" }),
  });
}

describe("POST /api/mobile/login", () => {
  it("does not issue a bearer token to a pending employee", async () => {
    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(mocks.issueMobileToken).not.toHaveBeenCalled();
  });

  it("allows the same employee to log in after approval", async () => {
    mocks.employee = { ...mocks.employee, isPending: false };

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect((await response.json()).accessToken).toBe("mobile-jwt");
  });
});
