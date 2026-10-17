import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/mobile-api/http", () => ({
  noStoreHeaders: { "Cache-Control": "no-store" },
  apiError: (status: number, message: string) => Response.json({ ok: false, message }, { status }),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.select.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockReturnValue({ order: mocks.order });
  mocks.createAdminClient.mockReturnValue({ from: () => ({ select: mocks.select }) });
});

describe("GET /api/mobile/headquarters", () => {
  it("returns only active headquarters IDs and names", async () => {
    mocks.order.mockResolvedValue({ data: [{ hq_id: 3, hq_name: "Main", lat: 1, long: 2, isDeleted: false }], error: null });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.select).toHaveBeenCalledWith("hq_id, hq_name");
    expect(mocks.eq).toHaveBeenCalledWith("isDeleted", false);
    expect(await response.json()).toEqual([{ hq_id: 3, hq_name: "Main" }]);
  });

  it("returns a service error when the headquarters query fails", async () => {
    mocks.order.mockResolvedValue({ data: null, error: { message: "database unavailable" } });

    const response = await GET();

    expect(response.status).toBe(503);
  });
});
