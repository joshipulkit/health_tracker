import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { goals } from "@/lib/db/schema";
import { jsonOk, parseBody } from "@/lib/http";
import { createId } from "@/lib/id";
import { nowIso } from "@/lib/time";
import { goalSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = await parseBody(request, goalSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const now = nowIso();
  const id = createId();

  const activeGoals = await db.select().from(goals).where(eq(goals.status, "active"));
  if (activeGoals.length > 0) {
    await db.update(goals).set({ status: "archived", updatedAt: now }).where(eq(goals.status, "active"));
  }

  await db.insert(goals).values({
    id,
    startDate: parsed.data.start_date,
    targetDate: parsed.data.target_date,
    targetWeightKg: parsed.data.target_weight_kg,
    targetBodyFatPct: parsed.data.target_body_fat_pct,
    targetPaceKgPerWeek: parsed.data.target_pace_kg_per_week,
    status: "active",
    createdAt: now,
    updatedAt: now
  });

  return jsonOk({ id, saved_at: now }, 201);
}

export async function GET() {
  const rows = await db.select().from(goals).orderBy(desc(goals.createdAt)).limit(20);
  return jsonOk({ data: rows });
}
