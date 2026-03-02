import { getDashboard, type DashboardRange } from "@/lib/dashboard";
import { jsonError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";

const validRanges = new Set<DashboardRange>(["7d", "30d", "90d"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const range = (url.searchParams.get("range") ?? "30d") as DashboardRange;

  if (!validRanges.has(range)) {
    return jsonError("Invalid range. Expected one of 7d, 30d, or 90d.", 400);
  }

  const data = await getDashboard(range);
  return jsonOk(data);
}
