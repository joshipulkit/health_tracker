import { jsonError, jsonOk } from "@/lib/http";
import { nutritionSearch } from "@/lib/nutrition";
import { nutritionSearchSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("query") ?? "";
  const parsed = nutritionSearchSchema.safeParse({ query });

  if (!parsed.success) {
    return jsonError("Invalid query parameter", 400, parsed.error.flatten());
  }

  const candidates = await nutritionSearch(parsed.data.query);
  return jsonOk({ data: candidates });
}
