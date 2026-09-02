import { z } from "zod";
import { summarizeWorkInput } from "@/lib/ai/gemini";
import { authenticateMobileRequest } from "@/lib/mobile-api/auth";
import { apiError, noStoreHeaders, parseJson } from "@/lib/mobile-api/http";

export const runtime = "nodejs";

const summaryRequestSchema = z.object({
  employeeInput: z.string().trim().min(1).max(10_000),
});

export async function POST(request: Request) {
  const employee = await authenticateMobileRequest(request);
  if (!employee) return apiError(401, "Authentication required.");

  const parsed = await parseJson(request, summaryRequestSchema);
  if (!parsed?.success) return apiError(400, "Employee work input is required.");

  try {
    const summary = await summarizeWorkInput(parsed.data.employeeInput);
    return Response.json({ ok: true, summary }, { headers: noStoreHeaders });
  } catch {
    return apiError(503, "AI summarization is unavailable.");
  }
}