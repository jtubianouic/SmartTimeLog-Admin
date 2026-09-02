import { noStoreHeaders } from "@/lib/mobile-api/http";
import { mobileOpenApiDocument } from "@/lib/mobile-api/openapi";

export function GET() {
  return Response.json(mobileOpenApiDocument, { headers: noStoreHeaders });
}