import { and, desc, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bodyMetrics,
  exerciseLogs,
  foodLogs,
  goals,
  sleepLogs,
  userProfile
} from "@/lib/db/schema";
import { classifyGoalStatus, linearSlope } from "@/lib/calculations";
import { daysAgo, toDateKey } from "@/lib/time";

export type DashboardRange = "7d" | "30d" | "90d";

export type DashboardPayload = {
  range: DashboardRange;
  series: Array<{
    date: string;
    calories_in: number;
    calories_out: number;
    protein_g: number;
    sleep_score: number | null;
    sleep_hours: number | null;
    weight_kg: number | null;
    body_fat_pct: number | null;
    exercise_sessions: number;
  }>;
  adherence: {
    workout_days: number;
    logged_days: number;
    protein_target_hit_days: number;
  };
  goal_status: {
    status: "on_track" | "at_risk" | "off_track" | "no_goal";
    details: string;
  };
};

export function rangeToDays(range: DashboardRange): number {
  if (range === "7d") return 7;
  if (range === "90d") return 90;
  return 30;
}

export async function getDashboard(range: DashboardRange): Promise<DashboardPayload> {
  const days = rangeToDays(range);
  const startDate = daysAgo(days);
  const startIso = startDate.toISOString();
  const endIso = new Date().toISOString();

  const [foods, exercises, sleeps, bodies, activeGoalRows, profileRows] = await Promise.all([
    db
      .select()
      .from(foodLogs)
      .where(and(gte(foodLogs.dateTime, startIso), lte(foodLogs.dateTime, endIso)))
      .orderBy(foodLogs.dateTime),
    db
      .select()
      .from(exerciseLogs)
      .where(and(gte(exerciseLogs.dateTime, startIso), lte(exerciseLogs.dateTime, endIso)))
      .orderBy(exerciseLogs.dateTime),
    db.select().from(sleepLogs).where(and(gte(sleepLogs.date, toDateKey(startDate)), lte(sleepLogs.date, toDateKey(endIso)))),
    db.select().from(bodyMetrics).where(and(gte(bodyMetrics.date, toDateKey(startDate)), lte(bodyMetrics.date, toDateKey(endIso)))),
    db.select().from(goals).where(and(lte(goals.startDate, toDateKey(endIso)), gte(goals.targetDate, toDateKey(startDate)))).orderBy(desc(goals.createdAt)),
    db.select().from(userProfile).orderBy(desc(userProfile.updatedAt))
  ]);

  const daily = new Map<
    string,
    {
      date: string;
      calories_in: number;
      calories_out: number;
      protein_g: number;
      sleep_score: number | null;
      sleep_hours: number | null;
      weight_kg: number | null;
      body_fat_pct: number | null;
      exercise_sessions: number;
    }
  >();

  function ensure(date: string) {
    if (!daily.has(date)) {
      daily.set(date, {
        date,
        calories_in: 0,
        calories_out: 0,
        protein_g: 0,
        sleep_score: null,
        sleep_hours: null,
        weight_kg: null,
        body_fat_pct: null,
        exercise_sessions: 0
      });
    }
    return daily.get(date)!;
  }

  for (const row of foods) {
    const key = toDateKey(row.dateTime);
    const point = ensure(key);
    point.calories_in += row.caloriesKcal ?? 0;
    point.protein_g += row.proteinG ?? 0;
  }

  for (const row of exercises) {
    const key = toDateKey(row.dateTime);
    const point = ensure(key);
    point.calories_out += row.caloriesBurnedKcal ?? 0;
    point.exercise_sessions += 1;
  }

  for (const row of sleeps) {
    const point = ensure(row.date);
    point.sleep_score = row.sleepScore;
    point.sleep_hours = row.sleepHours;
  }

  for (const row of bodies) {
    const point = ensure(row.date);
    point.weight_kg = row.weightKg;
    point.body_fat_pct = row.bodyFatPct;
  }

  const series = Array.from(daily.values()).sort((a, b) => a.date.localeCompare(b.date));

  const proteinTarget = 130;
  const adherence = {
    workout_days: series.filter((s) => s.exercise_sessions > 0).length,
    logged_days: series.filter((s) => s.calories_in > 0 || s.weight_kg != null || s.sleep_score != null).length,
    protein_target_hit_days: series.filter((s) => s.protein_g >= proteinTarget).length
  };

  const activeGoal = activeGoalRows[0];
  const latestProfile = profileRows[0];

  let goal_status: DashboardPayload["goal_status"] = {
    status: "no_goal",
    details: "No active goal found."
  };

  if (activeGoal) {
    const weightSeries = series
      .filter((point) => point.weight_kg != null)
      .map((point, idx) => ({ x: idx, y: point.weight_kg as number }));
    const trend = linearSlope(weightSeries);
    const latestWeight =
      series.slice().reverse().find((point) => point.weight_kg != null)?.weight_kg ??
      latestProfile?.currentWeightKg;

    if (latestWeight != null) {
      const status = classifyGoalStatus({
        currentWeightKg: latestWeight,
        targetWeightKg: activeGoal.targetWeightKg,
        targetDateIso: `${activeGoal.targetDate}T00:00:00.000Z`,
        startDateIso: `${activeGoal.startDate}T00:00:00.000Z`,
        trendKgPerDay: trend
      });
      goal_status = {
        status,
        details:
          status === "on_track"
            ? "Current trend aligns with the target date."
            : status === "at_risk"
              ? "Progress is close but needs tighter consistency."
              : "Current trend is not sufficient for the target date."
      };
    }
  }

  return {
    range,
    series,
    adherence,
    goal_status
  };
}
