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
  const link = approvalUrl.toString();
  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#07100f;color:#edf8f5;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#07100f;padding:40px 16px;">
      <tr><td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;background:#0c1d1b;border:1px solid #28483f;border-radius:16px;">
          <tr><td style="padding:32px 32px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="width:36px;height:36px;background:#153b33;border:1px solid #3de1c1;border-radius:9px;text-align:center;color:#3de1c1;font-size:19px;font-weight:700;">S</td>
              <td style="padding-left:12px;color:#edf8f5;font-size:17px;font-weight:700;">SmartTimeLog</td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:36px 32px 32px;">
            <p style="margin:0 0 12px;color:#3de1c1;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Employee registration</p>
            <h1 style="margin:0 0 16px;color:#edf8f5;font-size:26px;line-height:1.25;">Someone is waiting for your approval.</h1>
            <p style="margin:0 0 28px;color:#a9c0ba;font-size:15px;line-height:1.65;">A new employee signed up with the SmartTimeLog QR code. Review their details before activating their account.</p>
            <a href="${link}" style="display:inline-block;background:#3de1c1;border-radius:9px;padding:15px 24px;color:#05241d;font-size:14px;font-weight:700;text-decoration:none;">Review registration</a>
            <p style="margin:28px 0 0;color:#a9c0ba;font-size:12px;line-height:1.6;">This link expires in 24 hours. An expired link does not delete the pending registration.</p>
          </td></tr>
        </table>
        <p style="max-width:520px;margin:20px 0 0;color:#78948d;font-size:11px;line-height:1.6;">SmartTimeLog · Employee approvals</p>
      </td></tr>
    </table>
  </body>
</html>`;

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
      text: `A new employee registered with the SmartTimeLog QR code. Review their details and approve the account here: ${link}\n\nThis link expires in 24 hours. An expired link does not delete the pending registration.`,
      html,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Pending registration email failed with status ${response.status}.`);
  }
}
