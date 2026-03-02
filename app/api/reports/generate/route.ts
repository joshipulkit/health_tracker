import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { bodyMetrics, reportSnapshots, userProfile } from "@/lib/db/schema";
import { getDashboard } from "@/lib/dashboard";
import {
  calculateBmrKatchMcArdle,
  calculateBmrMifflinStJeor,
  tdeeFromBmr
} from "@/lib/calculations";
import { jsonError, jsonOk } from "@/lib/http";
import { createId } from "@/lib/id";
import { generateRuleBasedReport } from "@/lib/rules";
import { nowIso, startAndEndForPeriod, toDateKey } from "@/lib/time";
import { reportPeriodSchema } from "@/lib/validators";

export const runtime = "nodejs";

function isSupportedSex(value: string | null | undefined): value is "male" | "female" | "other" {
  return value === "male" || value === "female" || value === "other";
}

function ageFromDob(dob?: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < birth.getUTCMonth() ||
    (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age > 0 ? age : null;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const parsedPeriod = reportPeriodSchema.safeParse({
    period: url.searchParams.get("period") ?? "daily"
  });
  if (!parsedPeriod.success) {
    return jsonError("Invalid period", 400, parsedPeriod.error.flatten());
  }
  const { period } = parsedPeriod.data;

  const dashboard = await getDashboard(period === "daily" ? "7d" : "30d");
  const { start, end } = startAndEndForPeriod(period);

  const selectedSeries = dashboard.series.filter(
    (point) => point.date >= toDateKey(start) && point.date <= toDateKey(end)
  );

  const [profile, latestBody] = await Promise.all([
    db.select().from(userProfile).orderBy(desc(userProfile.updatedAt)).limit(1),
    db.select().from(bodyMetrics).orderBy(desc(bodyMetrics.date)).limit(1)
  ]);

  const p = profile[0];
  const b = latestBody[0];
  let tdeeKcal: number | undefined;
  if (p && b) {
    let bmr: number | undefined;
    if (b.bodyFatPct > 0) {
      bmr = calculateBmrKatchMcArdle(b.weightKg, b.bodyFatPct);
    } else if (p.heightCm && isSupportedSex(p.sex)) {
      const age = ageFromDob(p.dob);
      if (age != null) {
        bmr = calculateBmrMifflinStJeor(b.weightKg, p.heightCm, age, p.sex);
      }
    }
    if (
      bmr != null &&
      p.baselineActivityLevel &&
      ["sedentary", "light", "moderate", "active"].includes(p.baselineActivityLevel)
    ) {
      tdeeKcal = tdeeFromBmr(
        bmr,
        p.baselineActivityLevel as "sedentary" | "light" | "moderate" | "active"
      );
    }
  }

  const report = generateRuleBasedReport(
    selectedSeries.map((point) => ({
      date: point.date,
      caloriesIn: point.calories_in,
      caloriesOut: point.calories_out,
      proteinG: point.protein_g,
      sleepScore: point.sleep_score,
      didWorkout: point.exercise_sessions > 0,
      weightKg: point.weight_kg,
      bodyFatPct: point.body_fat_pct
    })),
    { targetProteinG: 130, tdeeKcal }
  );

  const profileName = profile[0]?.name ?? "Athlete";
  const summary = `${profileName}, ${report.summary}`;
  const now = nowIso();
  const id = createId();

  await db.insert(reportSnapshots).values({
    id,
    periodType: period,
    periodStart: toDateKey(start),
    periodEnd: toDateKey(end),
    summaryText: summary,
    actionsJson: JSON.stringify(report.actions),
    patternsJson: JSON.stringify(report.patterns),
    createdAt: now
  });

  return jsonOk(
    {
      id,
      period,
      summary,
      patterns: report.patterns,
      actions: report.actions,
      created_at: now
    },
    201
  );
}
