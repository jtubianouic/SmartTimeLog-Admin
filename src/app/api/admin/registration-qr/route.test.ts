import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getRegistrationAccessToken: vi.fn(),
  toDataURL: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("qrcode", () => ({ default: { toDataURL: mocks.toDataURL } }));
vi.mock("@/lib/registration-access-token", () => ({
  getRegistrationAccessToken: mocks.getRegistrationAccessToken,
}));

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getRegistrationAccessToken.mockResolvedValue({ token: "a".repeat(64), expiresAt: "2026-10-17T12:30:00.000Z" });
  mocks.toDataURL.mockResolvedValue("data:image/png;base64,example");
});

describe("GET /api/admin/registration-qr", () => {
  it("returns the QR without an administrator session", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({
      qrCode: "data:image/png;base64,example",
      expiresAt: "2026-10-17T12:30:00.000Z",
    });
    expect(mocks.toDataURL).toHaveBeenCalledWith("a".repeat(64), expect.objectContaining({ errorCorrectionLevel: "H" }));
  });

  it("reports token service failures without exposing internals", async () => {
    mocks.getRegistrationAccessToken.mockRejectedValue(new Error("database unavailable"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await GET();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ message: "Unable to load the registration QR code." });
    errorSpy.mockRestore();
  });
});
