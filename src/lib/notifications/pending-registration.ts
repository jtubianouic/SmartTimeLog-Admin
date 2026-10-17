import "server-only";

export async function notifyPendingRegistration(approvalToken: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REGISTRATION_NOTIFICATION_FROM_EMAIL;
  const appBaseUrl = process.env.APP_BASE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined);
  if (!apiKey || !from || !appBaseUrl) {
    throw new Error("Pending registration email is not configured.");
  }

  const baseUrl = new URL(appBaseUrl);
  if (baseUrl.protocol !== "https:" && !(baseUrl.protocol === "http:" && baseUrl.hostname === "localhost")) {
    throw new Error("APP_BASE_URL must use HTTPS outside localhost.");
  }
  const approvalUrl = new URL("/registration-approval", baseUrl);
  approvalUrl.searchParams.set("token", approvalToken);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: ["debuggerjames@gmail.com"],
      subject: "SmartTimeLog employee registration pending",
      text: `A new employee registration is waiting for approval. Open this link to review and approve it without signing in: ${approvalUrl}`,
      html: `<p>A new employee registration is waiting for approval.</p><p><a href="${approvalUrl}">Review and approve registration</a></p><p>This link expires in 24 hours and can only approve this registration once.</p>`,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Pending registration email failed with status ${response.status}.`);
  }
}
