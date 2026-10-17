import QRCode from "qrcode";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getRegistrationAccessToken } from "@/lib/registration-access-token";

export const runtime = "nodejs";

const headers = { "Cache-Control": "no-store" };

export async function GET() {
  await requireAdmin();

  try {
    const { token, expiresAt } = await getRegistrationAccessToken();
    const qrCode = await QRCode.toDataURL(token, {
      errorCorrectionLevel: "H",
      margin: 4,
      width: 640,
    });
    return Response.json({ qrCode, expiresAt }, { headers });
  } catch (error) {
    console.error("Registration QR request failed:", error);
    return Response.json(
      { message: "Unable to load the registration QR code." },
      { status: 503, headers },
    );
  }
}
