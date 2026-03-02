import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { bodyMetrics, exerciseLogs } from "@/lib/db/schema";
import { calculateExerciseCalories } from "@/lib/calculations";
import { jsonError, jsonOk, parseBody } from "@/lib/http";
import { createId } from "@/lib/id";
import { inferMetValue } from "@/lib/met";
import { nowIso } from "@/lib/time";
import { exerciseLogSchema, exerciseLogUpdateSchema, idSchema } from "@/lib/validators";

export const runtime = "nodejs";

async function getLatestWeight() {
  const row = await db.select().from(bodyMetrics).orderBy(desc(bodyMetrics.date)).limit(1);
  return row[0]?.weightKg ?? 80;
}

export async function POST(request: Request) {
  const parsed = await parseBody(request, exerciseLogSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const now = nowIso();
  const id = createId();
  const latestWeight = await getLatestWeight();
  const metValue =
    parsed.data.met_value ?? inferMetValue(parsed.data.activity_name, parsed.data.intensity);
  const caloriesBurned =
    parsed.data.calories_burned_kcal ??
    calculateExerciseCalories(metValue, latestWeight, parsed.data.duration_min);

  await db.insert(exerciseLogs).values({
    id,
    dateTime: parsed.data.date_time,
    activityName: parsed.data.activity_name,
    durationMin: parsed.data.duration_min,
    intensity: parsed.data.intensity,
    metValue,
    caloriesBurnedKcal: Number(caloriesBurned.toFixed(2)),
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
    const rows = await db.select().from(exerciseLogs).orderBy(desc(exerciseLogs.dateTime)).limit(limit);
    return jsonOk({ data: rows });
  }

  const rows = await db
    .select()
    .from(exerciseLogs)
    .where(and(gte(exerciseLogs.dateTime, start), lte(exerciseLogs.dateTime, end)))
    .orderBy(desc(exerciseLogs.dateTime))
    .limit(limit);

  return jsonOk({ data: rows });
}

export async function PUT(request: Request) {
  const parsed = await parseBody(request, exerciseLogUpdateSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const existing = await db
    .select({ id: exerciseLogs.id })
    .from(exerciseLogs)
    .where(eq(exerciseLogs.id, parsed.data.id))
    .limit(1);
  if (existing.length === 0) {
    return jsonError("Exercise log not found", 404);
  }

  const latestWeight = await getLatestWeight();
  const metValue =
    parsed.data.met_value ?? inferMetValue(parsed.data.activity_name, parsed.data.intensity);
  const caloriesBurned =
    parsed.data.calories_burned_kcal ??
    calculateExerciseCalories(metValue, latestWeight, parsed.data.duration_min);

  const now = nowIso();
  await db
    .update(exerciseLogs)
    .set({
      dateTime: parsed.data.date_time,
      activityName: parsed.data.activity_name,
      durationMin: parsed.data.duration_min,
      intensity: parsed.data.intensity,
      metValue,
      caloriesBurnedKcal: Number(caloriesBurned.toFixed(2)),
      notes: parsed.data.notes,
      updatedAt: now
    })
    .where(eq(exerciseLogs.id, parsed.data.id));

  return jsonOk({ id: parsed.data.id, updated_at: now });
}

export async function DELETE(request: Request) {
  const parsed = await parseBody(request, idSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const existing = await db
    .select({ id: exerciseLogs.id })
    .from(exerciseLogs)
    .where(eq(exerciseLogs.id, parsed.data.id))
    .limit(1);
  if (existing.length === 0) {
    return jsonError("Exercise log not found", 404);
  }

  await db.delete(exerciseLogs).where(eq(exerciseLogs.id, parsed.data.id));
  return jsonOk({ id: parsed.data.id, deleted: true });
}
