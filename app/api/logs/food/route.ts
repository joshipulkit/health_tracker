import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { foodLogs } from "@/lib/db/schema";
import { jsonError, jsonOk, parseBody } from "@/lib/http";
import { createId } from "@/lib/id";
import { nowIso } from "@/lib/time";
import { foodLogSchema, foodLogUpdateSchema, idSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = await parseBody(request, foodLogSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const now = nowIso();
  const id = createId();

  await db.insert(foodLogs).values({
    id,
    dateTime: parsed.data.date_time,
    mealType: parsed.data.meal_type,
    itemName: parsed.data.item_name,
    quantity: parsed.data.quantity,
    unit: parsed.data.unit,
    grams: parsed.data.grams,
    caloriesKcal: parsed.data.calories_kcal,
    proteinG: parsed.data.protein_g,
    carbsG: parsed.data.carbs_g,
    fatG: parsed.data.fat_g,
    fiberG: parsed.data.fiber_g,
    source: parsed.data.source ?? "manual",
    sourceRef: parsed.data.source_ref ?? null,
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
    const rows = await db.select().from(foodLogs).orderBy(desc(foodLogs.dateTime)).limit(limit);
    return jsonOk({ data: rows });
  }

  const rows = await db
    .select()
    .from(foodLogs)
    .where(and(gte(foodLogs.dateTime, start), lte(foodLogs.dateTime, end)))
    .orderBy(desc(foodLogs.dateTime))
    .limit(limit);
  return jsonOk({ data: rows });
}

export async function PUT(request: Request) {
  const parsed = await parseBody(request, foodLogUpdateSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const existing = await db.select({ id: foodLogs.id }).from(foodLogs).where(eq(foodLogs.id, parsed.data.id)).limit(1);
  if (existing.length === 0) {
    return jsonError("Food log not found", 404);
  }

  const now = nowIso();
  await db
    .update(foodLogs)
    .set({
      dateTime: parsed.data.date_time,
      mealType: parsed.data.meal_type,
      itemName: parsed.data.item_name,
      quantity: parsed.data.quantity,
      unit: parsed.data.unit,
      grams: parsed.data.grams,
      caloriesKcal: parsed.data.calories_kcal,
      proteinG: parsed.data.protein_g,
      carbsG: parsed.data.carbs_g,
      fatG: parsed.data.fat_g,
      fiberG: parsed.data.fiber_g,
      source: parsed.data.source ?? "manual",
      sourceRef: parsed.data.source_ref ?? null,
      notes: parsed.data.notes,
      updatedAt: now
    })
    .where(eq(foodLogs.id, parsed.data.id));

  return jsonOk({ id: parsed.data.id, updated_at: now });
}

export async function DELETE(request: Request) {
  const parsed = await parseBody(request, idSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const existing = await db.select({ id: foodLogs.id }).from(foodLogs).where(eq(foodLogs.id, parsed.data.id)).limit(1);
  if (existing.length === 0) {
    return jsonError("Food log not found", 404);
  }

  await db.delete(foodLogs).where(eq(foodLogs.id, parsed.data.id));
  return jsonOk({ id: parsed.data.id, deleted: true });
}
