import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { bodyMetrics } from "@/lib/db/schema";
import { jsonError, jsonOk, parseBody } from "@/lib/http";
import { createId } from "@/lib/id";
import { nowIso } from "@/lib/time";
import { bodyMetricSchema, bodyMetricUpdateSchema, idSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = await parseBody(request, bodyMetricSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const now = nowIso();
  const id = createId();

  await db.insert(bodyMetrics).values({
    id,
    date: parsed.data.date,
    weightKg: parsed.data.weight_kg,
    bodyFatPct: parsed.data.body_fat_pct,
    waistCm: parsed.data.waist_cm,
    restingHr: parsed.data.resting_hr,
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
    const rows = await db.select().from(bodyMetrics).orderBy(desc(bodyMetrics.date)).limit(limit);
    return jsonOk({ data: rows });
  }

  const rows = await db
    .select()
    .from(bodyMetrics)
    .where(and(gte(bodyMetrics.date, start), lte(bodyMetrics.date, end)))
    .orderBy(desc(bodyMetrics.date))
    .limit(limit);

  return jsonOk({ data: rows });
}

export async function PUT(request: Request) {
  const parsed = await parseBody(request, bodyMetricUpdateSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const existing = await db
    .select({ id: bodyMetrics.id })
    .from(bodyMetrics)
    .where(eq(bodyMetrics.id, parsed.data.id))
    .limit(1);
  if (existing.length === 0) {
    return jsonError("Body entry not found", 404);
  }

  const now = nowIso();
  await db
    .update(bodyMetrics)
    .set({
      date: parsed.data.date,
      weightKg: parsed.data.weight_kg,
      bodyFatPct: parsed.data.body_fat_pct,
      waistCm: parsed.data.waist_cm,
      restingHr: parsed.data.resting_hr,
      notes: parsed.data.notes,
      updatedAt: now
    })
    .where(eq(bodyMetrics.id, parsed.data.id));

  return jsonOk({ id: parsed.data.id, updated_at: now });
}

export async function DELETE(request: Request) {
  const parsed = await parseBody(request, idSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const existing = await db
    .select({ id: bodyMetrics.id })
    .from(bodyMetrics)
    .where(eq(bodyMetrics.id, parsed.data.id))
    .limit(1);
  if (existing.length === 0) {
    return jsonError("Body entry not found", 404);
  }

  await db.delete(bodyMetrics).where(eq(bodyMetrics.id, parsed.data.id));
  return jsonOk({ id: parsed.data.id, deleted: true });
}
