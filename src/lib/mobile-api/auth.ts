import "server-only";

import { createHash } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { createAdminClient } from "@/lib/supabase/admin";

const issuer = "smarttimelog-admin";
const audience = "smarttimelog-mobile";
export const mobileTokenLifetimeSeconds = 60 * 60 * 12;

function getSigningKey() {
  const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serverKey) throw new Error("Supabase server credentials are not configured.");
  return createHash("sha256").update(`smarttimelog-mobile-v1:${serverKey}`).digest();
}

export async function issueMobileToken(employeeId: number) {
  return new SignJWT({ scope: "employee" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(String(employeeId))
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(`${mobileTokenLifetimeSeconds}s`)
    .sign(getSigningKey());
}

export async function authenticateMobileRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSigningKey(), { issuer, audience });
    const employeeId = Number(payload.sub);
    if (!Number.isInteger(employeeId) || employeeId <= 0 || payload.scope !== "employee") return null;

    const supabase = createAdminClient();
    const { data: employee, error } = await supabase
      .from("employee")
      .select("employee_id, username, firstname, lastname, hq_id, isDeleted")
      .eq("employee_id", employeeId)
      .maybeSingle();

    if (error || !employee || employee.isDeleted === true) return null;
    return employee;
  } catch {
    return null;
  }
}