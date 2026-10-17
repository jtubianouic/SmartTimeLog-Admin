import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  validateToken: vi.fn(),
  hashPassword: vi.fn(),
  createClient: vi.fn(),
  insertEmployee: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("bcryptjs", () => ({ hash: mocks.hashPassword }));
vi.mock("@/lib/mobile-api/http", () => ({
  noStoreHeaders: { "Cache-Control": "no-store" },
  apiError: (status: number, message: string) => Response.json({ ok: false, message }, { status }),
  parseJson: async (request: Request, schema: { safeParse: (value: unknown) => unknown }) => schema.safeParse(await request.json()),
}));
vi.mock("@/lib/registration-access-token", () => ({ isValidRegistrationAccessToken: mocks.validateToken }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createClient }));

import { POST } from "./route";

const body = {
  registrationToken: "a".repeat(64),
  firstName: "Ada",
  lastName: "Lovelace",
  username: "ada.lovelace",
  plainPassword: "correct-horse-battery",
  headquartersId: 1,
};

function request() {
  return new Request("http://localhost/api/mobile/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.hashPassword.mockResolvedValue("bcrypt-hash");
  mocks.insertEmployee.mockReturnValue({ select: () => ({ single: async () => ({ data: { employee_id: 42 }, error: null }) }) });
  mocks.createClient.mockReturnValue({
    from: (table: string) => {
      if (table === "headquarters") return {
        select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { hq_id: 1, hq_name: "Main", lat: 1, long: 2 }, error: null }) }) }) }),
      };
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
        insert: mocks.insertEmployee,
      };
    },
  });
});

describe("POST /api/mobile/register", () => {
  it("rejects an invalid or expired QR token without creating an employee", async () => {
    mocks.validateToken.mockResolvedValue(false);

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.insertEmployee).not.toHaveBeenCalled();
  });

  it("rechecks token expiry after hashing and before insertion", async () => {
    mocks.validateToken.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(mocks.insertEmployee).not.toHaveBeenCalled();
  });

  it("creates an employee with a hashed password and returns a safe response", async () => {
    mocks.validateToken.mockResolvedValue(true);

    const response = await POST(request());
    const result = await response.json();

    expect(response.status).toBe(201);
    expect(mocks.insertEmployee).toHaveBeenCalledWith(expect.objectContaining({
      username: body.username,
      hq_id: 1,
      password: "bcrypt-hash",
      registration_access_token: body.registrationToken,
      isPending: true,
    }));
    expect(result.isPending).toBe(true);
    expect(result.employee).toMatchObject({ employeeId: 42, username: body.username });
    expect(JSON.stringify(result)).not.toContain(body.plainPassword);
  });
});
