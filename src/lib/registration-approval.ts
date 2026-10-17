import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const approvalLifetimeMs = 24 * 60 * 60 * 1000;

type ApprovalPayload = {
  employeeId: number;
  createdAt: string;
  expiresAt: number;
};

function approvalKey() {
  const secret = process.env.REGISTRATION_TOKEN_SECRET;
  if (!secret) throw new Error("Registration token secret is not configured.");
  return createHash("sha256").update("registration-approval-v1\0").update(secret).digest();
}

export function createRegistrationApprovalToken(employeeId: number, createdAt: string) {
  if (!Number.isSafeInteger(employeeId) || employeeId <= 0 || !Number.isFinite(Date.parse(createdAt))) {
    throw new Error("Invalid registration approval details.");
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", approvalKey(), iv);
  const payload: ApprovalPayload = { employeeId, createdAt, expiresAt: Date.now() + approvalLifetimeMs };
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

export function readRegistrationApprovalToken(token: string): ApprovalPayload | null {
  if (!/^[A-Za-z0-9_-]{40,1024}$/.test(token)) return null;

  try {
    const data = Buffer.from(token, "base64url");
    if (data.length < 29) return null;
    const decipher = createDecipheriv("aes-256-gcm", approvalKey(), data.subarray(0, 12));
    decipher.setAuthTag(data.subarray(12, 28));
    const decoded = Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString("utf8");
    const payload = JSON.parse(decoded) as ApprovalPayload;
    if (!Number.isSafeInteger(payload.employeeId) || payload.employeeId <= 0 ||
      typeof payload.createdAt !== "string" || !Number.isFinite(Date.parse(payload.createdAt)) ||
      !Number.isSafeInteger(payload.expiresAt) || payload.expiresAt <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getRegistrationApprovalStatus(token: string) {
  const payload = readRegistrationApprovalToken(token);
  if (!payload) return "invalid" as const;

  const { data, error } = await createAdminClient()
    .from("employee")
    .select("created_at, isPending, isDeleted")
    .eq("employee_id", payload.employeeId)
    .maybeSingle();
  if (error) throw new Error("Unable to check registration approval.");
  if (!data || data.created_at !== payload.createdAt || data.isDeleted === true || data.isPending !== true) {
    return "unavailable" as const;
  }
  return "pending" as const;
}

export async function approveRegistrationWithToken(token: string) {
  const payload = readRegistrationApprovalToken(token);
  if (!payload) return false;

  const { data, error } = await createAdminClient()
    .from("employee")
    .update({ isPending: false })
    .eq("employee_id", payload.employeeId)
    .eq("created_at", payload.createdAt)
    .eq("isPending", true)
    .eq("isDeleted", false)
    .select("employee_id")
    .maybeSingle();
  if (error) throw new Error("Unable to approve registration.");
  return Boolean(data);
}
