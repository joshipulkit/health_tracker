import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { sleepLogs } from "@/lib/db/schema";
import { jsonError, jsonOk, parseBody } from "@/lib/http";
import { createId } from "@/lib/id";
import { nowIso } from "@/lib/time";
import { idSchema, sleepLogSchema, sleepLogUpdateSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = await parseBody(request, sleepLogSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const now = nowIso();
  const id = createId();

  await db.insert(sleepLogs).values({
    id,
    date: parsed.data.date,
    sleepHours: parsed.data.sleep_hours,
    sleepScore: parsed.data.sleep_score_1_10,
    sleepQualityText: parsed.data.sleep_quality_text,
    notes: parsed.data.notes,
    createdAt: now,
    updatedAt: now
  });

  return jsonOk({ id, saved_at: now }, 201);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");
  const limit = Number(url.searchParams.get("limit") ?? "100");

  if (Number.isNaN(limit) || limit <= 0) {
    return jsonError("Invalid limit query value", 400);
  }

  if (!start || !end) {
    const rows = await db.select().from(sleepLogs).orderBy(desc(sleepLogs.date)).limit(limit);
    return jsonOk({ data: rows });
  }

  const rows = await db
    .select()
    .from(sleepLogs)
    .where(and(gte(sleepLogs.date, start), lte(sleepLogs.date, end)))
    .orderBy(desc(sleepLogs.date))
    .limit(limit);

  return jsonOk({ data: rows });
}

export async function PUT(request: Request) {
  const parsed = await parseBody(request, sleepLogUpdateSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const existing = await db.select({ id: sleepLogs.id }).from(sleepLogs).where(eq(sleepLogs.id, parsed.data.id)).limit(1);
  if (existing.length === 0) {
    return jsonError("Sleep log not found", 404);
  }

  const now = nowIso();
  await db
    .update(sleepLogs)
    .set({
      date: parsed.data.date,
      sleepHours: parsed.data.sleep_hours,
      sleepScore: parsed.data.sleep_score_1_10,
      sleepQualityText: parsed.data.sleep_quality_text,
      notes: parsed.data.notes,
      updatedAt: now
    })
    .where(eq(sleepLogs.id, parsed.data.id));

  return jsonOk({ id: parsed.data.id, updated_at: now });
}

export async function DELETE(request: Request) {
  const parsed = await parseBody(request, idSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const existing = await db.select({ id: sleepLogs.id }).from(sleepLogs).where(eq(sleepLogs.id, parsed.data.id)).limit(1);
  if (existing.length === 0) {
    return jsonError("Sleep log not found", 404);
  }

  await db.delete(sleepLogs).where(eq(sleepLogs.id, parsed.data.id));
  return jsonOk({ id: parsed.data.id, deleted: true });
}
