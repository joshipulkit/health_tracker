import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userProfile } from "@/lib/db/schema";
import { jsonOk, parseBody } from "@/lib/http";
import { createId } from "@/lib/id";
import { nowIso } from "@/lib/time";
import { profileSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = await parseBody(request, profileSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const now = nowIso();
  const existing = await db.select().from(userProfile).orderBy(desc(userProfile.updatedAt)).limit(1);
  const existingId = existing[0]?.id;

  if (existingId) {
    await db
      .update(userProfile)
      .set({
        name: parsed.data.name,
        dob: parsed.data.dob,
        sex: parsed.data.sex,
        heightCm: parsed.data.height_cm,
        baselineActivityLevel: parsed.data.baseline_activity_level,
        preferredUnits: parsed.data.preferred_units,
        currentWeightKg: parsed.data.current_weight_kg,
        currentBodyFatPct: parsed.data.current_body_fat_pct,
        waistCm: parsed.data.waist_cm,
        restingHr: parsed.data.resting_hr,
        goalPaceKgPerWeek: parsed.data.goal_pace_kg_per_week,
        updatedAt: now
      })
      .where(eq(userProfile.id, existingId));
    return jsonOk({ id: existingId, saved_at: now }, 200);
  }

  const id = createId();
  await db.insert(userProfile).values({
    id,
    name: parsed.data.name,
    dob: parsed.data.dob,
    sex: parsed.data.sex,
    heightCm: parsed.data.height_cm,
    baselineActivityLevel: parsed.data.baseline_activity_level,
    preferredUnits: parsed.data.preferred_units,
    currentWeightKg: parsed.data.current_weight_kg,
    currentBodyFatPct: parsed.data.current_body_fat_pct,
    waistCm: parsed.data.waist_cm,
    restingHr: parsed.data.resting_hr,
    goalPaceKgPerWeek: parsed.data.goal_pace_kg_per_week,
    createdAt: now,
    updatedAt: now
  });

  return jsonOk({ id, saved_at: now }, 201);
}

export async function GET() {
  const rows = await db.select().from(userProfile).orderBy(desc(userProfile.updatedAt)).limit(1);
  return jsonOk({ data: rows[0] ?? null });
}
