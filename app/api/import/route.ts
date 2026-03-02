import { db } from "@/lib/db";
import {
  bodyMetrics,
  exerciseLogs,
  foodLogs,
  goals,
  reportSnapshots,
  sleepLogs,
  userProfile
} from "@/lib/db/schema";
import { jsonError, jsonOk, parseBody } from "@/lib/http";
import { nowIso } from "@/lib/time";
import { importSchema } from "@/lib/validators";

export const runtime = "nodejs";

type ImportPayload = {
  user_profile?: Array<Record<string, unknown>>;
  goals?: Array<Record<string, unknown>>;
  food_logs?: Array<Record<string, unknown>>;
  exercise_logs?: Array<Record<string, unknown>>;
  sleep_logs?: Array<Record<string, unknown>>;
  body_metrics?: Array<Record<string, unknown>>;
  report_snapshots?: Array<Record<string, unknown>>;
};

export async function POST(request: Request) {
  const parsed = await parseBody(request, importSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const payload = parsed.data.payload as ImportPayload;
  if (!payload || typeof payload !== "object") {
    return jsonError("Invalid import payload");
  }

  if (parsed.data.mode === "replace") {
    await db.delete(reportSnapshots);
    await db.delete(bodyMetrics);
    await db.delete(sleepLogs);
    await db.delete(exerciseLogs);
    await db.delete(foodLogs);
    await db.delete(goals);
    await db.delete(userProfile);
  }

  const now = nowIso();
  const inserted = {
    user_profile: 0,
    goals: 0,
    food_logs: 0,
    exercise_logs: 0,
    sleep_logs: 0,
    body_metrics: 0,
    report_snapshots: 0
  };

  if (Array.isArray(payload.user_profile) && payload.user_profile.length > 0) {
    await db.insert(userProfile).values(payload.user_profile as any);
    inserted.user_profile = payload.user_profile.length;
  }
  if (Array.isArray(payload.goals) && payload.goals.length > 0) {
    await db.insert(goals).values(payload.goals as any);
    inserted.goals = payload.goals.length;
  }
  if (Array.isArray(payload.food_logs) && payload.food_logs.length > 0) {
    await db.insert(foodLogs).values(payload.food_logs as any);
    inserted.food_logs = payload.food_logs.length;
  }
  if (Array.isArray(payload.exercise_logs) && payload.exercise_logs.length > 0) {
    await db.insert(exerciseLogs).values(payload.exercise_logs as any);
    inserted.exercise_logs = payload.exercise_logs.length;
  }
  if (Array.isArray(payload.sleep_logs) && payload.sleep_logs.length > 0) {
    await db.insert(sleepLogs).values(payload.sleep_logs as any);
    inserted.sleep_logs = payload.sleep_logs.length;
  }
  if (Array.isArray(payload.body_metrics) && payload.body_metrics.length > 0) {
    await db.insert(bodyMetrics).values(payload.body_metrics as any);
    inserted.body_metrics = payload.body_metrics.length;
  }
  if (Array.isArray(payload.report_snapshots) && payload.report_snapshots.length > 0) {
    await db.insert(reportSnapshots).values(payload.report_snapshots as any);
    inserted.report_snapshots = payload.report_snapshots.length;
  }

  return jsonOk({ imported_at: now, inserted });
}
