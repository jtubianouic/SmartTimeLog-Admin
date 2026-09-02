import { z } from "zod";

export const noStoreHeaders = { "Cache-Control": "no-store" };

export function apiError(status: number, message: string) {
  return Response.json({ ok: false, message }, { status, headers: noStoreHeaders });
}

export async function parseJson<T extends z.ZodType>(request: Request, schema: T) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_384) return null;

  try {
    return schema.safeParse(await request.json());
  } catch {
    return null;
  }
}

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  long: z.number().min(-180).max(180),
});