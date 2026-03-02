import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { reportSnapshots } from "@/lib/db/schema";
import { jsonOk } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const rows = await db.select().from(reportSnapshots).orderBy(desc(reportSnapshots.createdAt)).limit(30);
  const data = rows.map((row) => ({
    ...row,
    actions: JSON.parse(row.actionsJson) as string[],
    patterns: JSON.parse(row.patternsJson) as string[]
  }));
  return jsonOk({ data });
}
