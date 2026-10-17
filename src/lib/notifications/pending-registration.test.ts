import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { notifyPendingRegistration } from "./pending-registration";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("pending registration email", () => {
  it("sends a generic notification to the configured address", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("REGISTRATION_NOTIFICATION_FROM_EMAIL", "SmartTimeLog <updates@example.com>");
    vi.stubEnv("APP_BASE_URL", "https://example.com");
    const send = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", send);

    await notifyPendingRegistration("safe-token");

    expect(send).toHaveBeenCalledOnce();
    const [url, init] = send.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(JSON.parse(init.body as string)).toEqual({
      from: "SmartTimeLog <updates@example.com>",
      to: ["debuggerjames@gmail.com"],
      subject: "SmartTimeLog employee registration pending",
      text: "A new employee registration is waiting for approval. Open this link to review and approve it without signing in: https://example.com/registration-approval?token=safe-token",
      html: '<p>A new employee registration is waiting for approval.</p><p><a href="https://example.com/registration-approval?token=safe-token">Review and approve registration</a></p><p>This link expires in 24 hours and can only approve this registration once.</p>',
    });
  });

  it("reports missing email configuration without sending", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("REGISTRATION_NOTIFICATION_FROM_EMAIL", "");
    vi.stubEnv("APP_BASE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    const send = vi.fn();
    vi.stubGlobal("fetch", send);

    await expect(notifyPendingRegistration("safe-token")).rejects.toThrow("not configured");
    expect(send).not.toHaveBeenCalled();
  });

  it("uses the Vercel production URL when no app URL is configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("REGISTRATION_NOTIFICATION_FROM_EMAIL", "updates@example.com");
    vi.stubEnv("APP_BASE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "smarttimelog.example.com");
    const send = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", send);

    await notifyPendingRegistration("safe-token");

    const [, init] = send.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string).text).toContain("https://smarttimelog.example.com/registration-approval?token=safe-token");
  });
});
