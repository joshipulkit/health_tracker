import {
  average,
  calculateBmrKatchMcArdle,
  calculateBmrMifflinStJeor,
  calculateExerciseCalories,
  classifyGoalStatus,
  linearSlope,
  tdeeFromBmr
} from "@/lib/calculations";
import { LocalStores, clearStore, deleteRecord, getAllRecords, putRecord, putRecords } from "@/lib/local-db";
import type {
  BodyMetricRecord,
  DashboardRange,
  ExerciseLogRecord,
  FoodLogRecord,
  GoalRecord,
  LocalExportPayload,
  ReportPeriod,
  ReportSnapshotRecord,
  SleepLogRecord,
  UserProfileRecord
} from "@/lib/local-types";
import { inferMetValue } from "@/lib/met";
import { generateRuleBasedReport } from "@/lib/rules";
import { toDateKey } from "@/lib/time";

function nowIso() {
  return new Date().toISOString();
}

function createId() {
  return crypto.randomUUID();
}

function toNullableNumber(value: number | "" | undefined | null): number | undefined {
  if (value === "" || value == null || Number.isNaN(value)) {
    return undefined;
  }
  return Number(value);
}

function getRangeDays(range: DashboardRange): number {
  if (range === "7d") return 7;
  if (range === "90d") return 90;
  return 30;
}

function toDateBounds(selectedDate: string, windowMode: "day" | "week") {
  const end = new Date(`${selectedDate}T23:59:59.999`);
  const start = new Date(`${selectedDate}T00:00:00.000`);
  if (windowMode === "week") {
    start.setDate(start.getDate() - 6);
  }
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    startDate: toDateKey(start),
    endDate: toDateKey(end)
  };
}

export async function getProfile(): Promise<UserProfileRecord | null> {
  const profiles = await getAllRecords(LocalStores.profile);
  if (profiles.length === 0) return null;
  return profiles.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
}

export async function saveProfile(
  input: Omit<UserProfileRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }
) {
  const existing = await getProfile();
  const timestamp = nowIso();
  const record: UserProfileRecord = {
    id: existing?.id ?? input.id ?? "self",
    name: input.name,
    dob: input.dob,
    sex: input.sex,
    heightCm: input.heightCm,
    baselineActivityLevel: input.baselineActivityLevel,
    preferredUnits: input.preferredUnits,
    currentWeightKg: input.currentWeightKg,
    currentBodyFatPct: input.currentBodyFatPct,
    waistCm: input.waistCm,
    restingHr: input.restingHr,
    goalPaceKgPerWeek: input.goalPaceKgPerWeek,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp
  };
  return putRecord(LocalStores.profile, record);
}

export async function getGoals(): Promise<GoalRecord[]> {
  const goals = await getAllRecords(LocalStores.goals);
  return goals.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveGoal(
  input: Omit<GoalRecord, "id" | "status" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<GoalRecord> {
  const now = nowIso();
  const goals = await getGoals();
  const updates = goals.map((goal) =>
    goal.status === "active" ? { ...goal, status: "archived" as const, updatedAt: now } : goal
  );
  if (updates.length > 0) {
    await putRecords(LocalStores.goals, updates);
  }

  const record: GoalRecord = {
    id: input.id ?? createId(),
    startDate: input.startDate,
    targetDate: input.targetDate,
    targetWeightKg: input.targetWeightKg,
    targetBodyFatPct: input.targetBodyFatPct,
    targetPaceKgPerWeek: input.targetPaceKgPerWeek,
    status: "active",
    createdAt: now,
    updatedAt: now
  };
  return putRecord(LocalStores.goals, record);
}

function latestWeightFromBody(bodyRows: BodyMetricRecord[], profile: UserProfileRecord | null): number {
  const sorted = [...bodyRows].sort((a, b) => b.date.localeCompare(a.date));
  return sorted[0]?.weightKg ?? profile?.currentWeightKg ?? 80;
}

export async function listFoodLogs(params?: {
  startIso?: string;
  endIso?: string;
  limit?: number;
}): Promise<FoodLogRecord[]> {
  const rows = await getAllRecords(LocalStores.foodLogs);
  const filtered = rows.filter((row) => {
    if (params?.startIso && row.dateTime < params.startIso) return false;
    if (params?.endIso && row.dateTime > params.endIso) return false;
    return true;
  });
  filtered.sort((a, b) => b.dateTime.localeCompare(a.dateTime));
  return filtered.slice(0, params?.limit ?? filtered.length);
}

export async function saveFoodLog(
  input: Omit<FoodLogRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<FoodLogRecord> {
  const now = nowIso();
  const existing = input.id ? await getAllRecords(LocalStores.foodLogs).then((rows) => rows.find((r) => r.id === input.id)) : null;
  const record: FoodLogRecord = {
    id: existing?.id ?? input.id ?? createId(),
    dateTime: input.dateTime,
    mealType: input.mealType,
    itemName: input.itemName,
    quantity: input.quantity,
    unit: input.unit,
    grams: toNullableNumber(input.grams),
    caloriesKcal: toNullableNumber(input.caloriesKcal),
    proteinG: toNullableNumber(input.proteinG),
    carbsG: toNullableNumber(input.carbsG),
    fatG: toNullableNumber(input.fatG),
    fiberG: toNullableNumber(input.fiberG),
    source: input.source ?? "manual",
    sourceRef: input.sourceRef,
    notes: input.notes,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
  return putRecord(LocalStores.foodLogs, record);
}

export async function deleteFoodLog(id: string) {
  await deleteRecord(LocalStores.foodLogs, id);
}

export async function listExerciseLogs(params?: {
  startIso?: string;
  endIso?: string;
  limit?: number;
}): Promise<ExerciseLogRecord[]> {
  const rows = await getAllRecords(LocalStores.exerciseLogs);
  const filtered = rows.filter((row) => {
    if (params?.startIso && row.dateTime < params.startIso) return false;
    if (params?.endIso && row.dateTime > params.endIso) return false;
    return true;
  });
  filtered.sort((a, b) => b.dateTime.localeCompare(a.dateTime));
  return filtered.slice(0, params?.limit ?? filtered.length);
}

export async function saveExerciseLog(
  input: Omit<ExerciseLogRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<ExerciseLogRecord> {
  const now = nowIso();
  const [existingRows, profile, bodyRows] = await Promise.all([
    getAllRecords(LocalStores.exerciseLogs),
    getProfile(),
    getAllRecords(LocalStores.bodyMetrics)
  ]);
  const existing = input.id ? existingRows.find((row) => row.id === input.id) : null;
  const weightKg = latestWeightFromBody(bodyRows, profile);
  const metValue = toNullableNumber(input.metValue) ?? inferMetValue(input.activityName, input.intensity);
  const caloriesBurned =
    toNullableNumber(input.caloriesBurnedKcal) ??
    Number(calculateExerciseCalories(metValue, weightKg, input.durationMin).toFixed(2));

  const record: ExerciseLogRecord = {
    id: existing?.id ?? input.id ?? createId(),
    dateTime: input.dateTime,
    activityName: input.activityName,
    durationMin: input.durationMin,
    intensity: input.intensity,
    metValue,
    caloriesBurnedKcal: caloriesBurned,
    notes: input.notes,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
  return putRecord(LocalStores.exerciseLogs, record);
}

export async function deleteExerciseLog(id: string) {
  await deleteRecord(LocalStores.exerciseLogs, id);
}

export async function listSleepLogs(params?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<SleepLogRecord[]> {
  const rows = await getAllRecords(LocalStores.sleepLogs);
  const filtered = rows.filter((row) => {
    if (params?.startDate && row.date < params.startDate) return false;
    if (params?.endDate && row.date > params.endDate) return false;
    return true;
  });
  filtered.sort((a, b) => b.date.localeCompare(a.date));
  return filtered.slice(0, params?.limit ?? filtered.length);
}

export async function saveSleepLog(
  input: Omit<SleepLogRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<SleepLogRecord> {
  const now = nowIso();
  const rows = await getAllRecords(LocalStores.sleepLogs);
  const existing = input.id ? rows.find((row) => row.id === input.id) : null;
  const record: SleepLogRecord = {
    id: existing?.id ?? input.id ?? createId(),
    date: input.date,
    sleepHours: input.sleepHours,
    sleepScore: input.sleepScore,
    sleepQualityText: input.sleepQualityText,
    notes: input.notes,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
  return putRecord(LocalStores.sleepLogs, record);
}

export async function deleteSleepLog(id: string) {
  await deleteRecord(LocalStores.sleepLogs, id);
}

export async function listBodyMetrics(params?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<BodyMetricRecord[]> {
  const rows = await getAllRecords(LocalStores.bodyMetrics);
  const filtered = rows.filter((row) => {
    if (params?.startDate && row.date < params.startDate) return false;
    if (params?.endDate && row.date > params.endDate) return false;
    return true;
  });
  filtered.sort((a, b) => b.date.localeCompare(a.date));
  return filtered.slice(0, params?.limit ?? filtered.length);
}

export async function saveBodyMetric(
  input: Omit<BodyMetricRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<BodyMetricRecord> {
  const now = nowIso();
  const rows = await getAllRecords(LocalStores.bodyMetrics);
  const existing = input.id ? rows.find((row) => row.id === input.id) : null;
  const record: BodyMetricRecord = {
    id: existing?.id ?? input.id ?? createId(),
    date: input.date,
    weightKg: input.weightKg,
    bodyFatPct: input.bodyFatPct,
    waistCm: toNullableNumber(input.waistCm),
    restingHr: toNullableNumber(input.restingHr),
    notes: input.notes,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
  return putRecord(LocalStores.bodyMetrics, record);
}

export async function deleteBodyMetric(id: string) {
  await deleteRecord(LocalStores.bodyMetrics, id);
}

export async function listLogsForDateWindow(selectedDate: string, windowMode: "day" | "week") {
  const bounds = toDateBounds(selectedDate, windowMode);
  const [food, exercise, sleep, body] = await Promise.all([
    listFoodLogs({ startIso: bounds.startIso, endIso: bounds.endIso, limit: 400 }),
    listExerciseLogs({ startIso: bounds.startIso, endIso: bounds.endIso, limit: 400 }),
    listSleepLogs({ startDate: bounds.startDate, endDate: bounds.endDate, limit: 400 }),
    listBodyMetrics({ startDate: bounds.startDate, endDate: bounds.endDate, limit: 400 })
  ]);

  return { food, exercise, sleep, body, ...bounds };
}

export async function getDashboardLocal(range: DashboardRange) {
  const days = getRangeDays(range);
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  const startIso = start.toISOString();
  const endIso = end.toISOString();
  const startDate = toDateKey(start);
  const endDate = toDateKey(end);

  const [foods, exercises, sleeps, bodies, goals, profile] = await Promise.all([
    listFoodLogs({ startIso, endIso, limit: 10000 }),
    listExerciseLogs({ startIso, endIso, limit: 10000 }),
    listSleepLogs({ startDate, endDate, limit: 10000 }),
    listBodyMetrics({ startDate, endDate, limit: 10000 }),
    getGoals(),
    getProfile()
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
    const point = ensure(toDateKey(row.dateTime));
    point.calories_in += row.caloriesKcal ?? 0;
    point.protein_g += row.proteinG ?? 0;
  }
  for (const row of exercises) {
    const point = ensure(toDateKey(row.dateTime));
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

  const activeGoal = goals.find((goal) => goal.status === "active") ?? null;
  let goal_status: { status: "on_track" | "at_risk" | "off_track" | "no_goal"; details: string } = {
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
      profile?.currentWeightKg;

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

  return { range, series, adherence, goal_status };
}

function ageFromDob(dob?: string): number | null {
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

function estimateTdee(profile: UserProfileRecord | null, latestBody: BodyMetricRecord | null): number | undefined {
  if (!profile || !latestBody) return undefined;
  let bmr: number | undefined;
  if (latestBody.bodyFatPct > 0) {
    bmr = calculateBmrKatchMcArdle(latestBody.weightKg, latestBody.bodyFatPct);
  } else if (profile.heightCm && profile.sex) {
    const age = ageFromDob(profile.dob);
    if (age != null) {
      bmr = calculateBmrMifflinStJeor(latestBody.weightKg, profile.heightCm, age, profile.sex);
    }
  }
  if (!bmr || !profile.baselineActivityLevel) {
    return undefined;
  }
  return tdeeFromBmr(bmr, profile.baselineActivityLevel);
}

export async function generateReportLocal(period: ReportPeriod): Promise<ReportSnapshotRecord> {
  const dashboard = await getDashboardLocal(period === "daily" ? "7d" : "30d");
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (period === "daily" ? 1 : 7));
  const startDate = toDateKey(start);
  const endDate = toDateKey(end);

  const selectedSeries = dashboard.series.filter((point) => point.date >= startDate && point.date <= endDate);
  const [profile, bodies] = await Promise.all([getProfile(), listBodyMetrics({ limit: 200 })]);
  const tdee = estimateTdee(profile, bodies[0] ?? null);

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
    { targetProteinG: 130, tdeeKcal: tdee }
  );

  const now = nowIso();
  const record: ReportSnapshotRecord = {
    id: createId(),
    periodType: period,
    periodStart: startDate,
    periodEnd: endDate,
    summaryText: `${profile?.name ?? "Athlete"}, ${report.summary}`,
    patterns: report.patterns,
    actions: report.actions,
    createdAt: now
  };
  await putRecord(LocalStores.reports, record);
  return record;
}

export async function listReports(): Promise<ReportSnapshotRecord[]> {
  const rows = await getAllRecords(LocalStores.reports);
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function withinDateRange<
  T extends {
    date?: string;
    dateTime?: string;
    periodStart?: string;
    periodEnd?: string;
    startDate?: string;
    targetDate?: string;
  }
>(
  row: T,
  startDate?: string,
  endDate?: string
): boolean {
  const key =
    row.date ??
    (row.dateTime ? toDateKey(row.dateTime) : row.periodStart ?? row.periodEnd ?? row.startDate ?? row.targetDate ?? "");
  if (!key) return true;
  if (startDate && key < startDate) return false;
  if (endDate && key > endDate) return false;
  return true;
}

export async function exportLocalData(params: {
  rangeStart?: string;
  rangeEnd?: string;
}): Promise<LocalExportPayload> {
  const [profile, goals, foods, exercises, sleeps, bodies, reports] = await Promise.all([
    getAllRecords(LocalStores.profile),
    getAllRecords(LocalStores.goals),
    getAllRecords(LocalStores.foodLogs),
    getAllRecords(LocalStores.exerciseLogs),
    getAllRecords(LocalStores.sleepLogs),
    getAllRecords(LocalStores.bodyMetrics),
    getAllRecords(LocalStores.reports)
  ]);

  const start = params.rangeStart;
  const end = params.rangeEnd;
  return {
    exported_at: nowIso(),
    range_start: start ?? null,
    range_end: end ?? null,
    user_profile: profile,
    goals: goals.filter((row) => withinDateRange(row, start, end)),
    food_logs: foods.filter((row) => withinDateRange(row, start, end)),
    exercise_logs: exercises.filter((row) => withinDateRange(row, start, end)),
    sleep_logs: sleeps.filter((row) => withinDateRange(row, start, end)),
    body_metrics: bodies.filter((row) => withinDateRange(row, start, end)),
    report_snapshots: reports.filter((row) => withinDateRange(row, start, end))
  };
}

function normalizeNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export async function importLocalData(payload: unknown, mode: "append" | "replace") {
  if (typeof payload !== "object" || payload == null) {
    throw new Error("Invalid import payload.");
  }
  const data = payload as Partial<LocalExportPayload>;

  if (mode === "replace") {
    await Promise.all([
      clearStore(LocalStores.profile),
      clearStore(LocalStores.goals),
      clearStore(LocalStores.foodLogs),
      clearStore(LocalStores.exerciseLogs),
      clearStore(LocalStores.sleepLogs),
      clearStore(LocalStores.bodyMetrics),
      clearStore(LocalStores.reports)
    ]);
  }

  const inserted = {
    user_profile: 0,
    goals: 0,
    food_logs: 0,
    exercise_logs: 0,
    sleep_logs: 0,
    body_metrics: 0,
    report_snapshots: 0
  };

  const normalizeUserProfiles =
    (data.user_profile ?? []).map((row) => ({
      id: String(row.id ?? createId()),
      name: String(row.name ?? "User"),
      preferredUnits: (row.preferredUnits === "imperial" ? "imperial" : "metric") as "metric" | "imperial",
      dob: row.dob,
      sex: row.sex,
      heightCm: normalizeNumber(row.heightCm),
      baselineActivityLevel: row.baselineActivityLevel as UserProfileRecord["baselineActivityLevel"],
      currentWeightKg: normalizeNumber(row.currentWeightKg),
      currentBodyFatPct: normalizeNumber(row.currentBodyFatPct),
      waistCm: normalizeNumber(row.waistCm),
      restingHr: normalizeNumber(row.restingHr),
      goalPaceKgPerWeek: normalizeNumber(row.goalPaceKgPerWeek),
      createdAt: String(row.createdAt ?? nowIso()),
      updatedAt: String(row.updatedAt ?? nowIso())
    })) ?? [];

  const normalizeGoals =
    (data.goals ?? []).map((row) => ({
      id: String(row.id ?? createId()),
      startDate: String(row.startDate ?? toDateKey(new Date())),
      targetDate: String(row.targetDate ?? toDateKey(new Date())),
      targetWeightKg: normalizeNumber(row.targetWeightKg) ?? 0,
      targetBodyFatPct: normalizeNumber(row.targetBodyFatPct),
      targetPaceKgPerWeek: normalizeNumber(row.targetPaceKgPerWeek),
      status: (row.status === "archived" ? "archived" : "active") as GoalRecord["status"],
      createdAt: String(row.createdAt ?? nowIso()),
      updatedAt: String(row.updatedAt ?? nowIso())
    })) ?? [];

  const normalizeFoods =
    (data.food_logs ?? []).map((row) => ({
      id: String(row.id ?? createId()),
      dateTime: String(row.dateTime ?? nowIso()),
      mealType: (["breakfast", "lunch", "dinner", "snack"].includes(String(row.mealType))
        ? String(row.mealType)
        : "lunch") as FoodLogRecord["mealType"],
      itemName: String(row.itemName ?? "Food"),
      quantity: normalizeNumber(row.quantity) ?? 1,
      unit: String(row.unit ?? "serving"),
      grams: normalizeNumber(row.grams),
      caloriesKcal: normalizeNumber(row.caloriesKcal),
      proteinG: normalizeNumber(row.proteinG),
      carbsG: normalizeNumber(row.carbsG),
      fatG: normalizeNumber(row.fatG),
      fiberG: normalizeNumber(row.fiberG),
      source: (["manual", "usda", "openfoodfacts", "mixed"].includes(String(row.source))
        ? String(row.source)
        : "manual") as FoodLogRecord["source"],
      sourceRef: row.sourceRef ? String(row.sourceRef) : undefined,
      notes: row.notes ? String(row.notes) : undefined,
      createdAt: String(row.createdAt ?? nowIso()),
      updatedAt: String(row.updatedAt ?? nowIso())
    })) ?? [];

  const normalizeExercises =
    (data.exercise_logs ?? []).map((row) => ({
      id: String(row.id ?? createId()),
      dateTime: String(row.dateTime ?? nowIso()),
      activityName: String(row.activityName ?? "Exercise"),
      durationMin: normalizeNumber(row.durationMin) ?? 30,
      intensity: (["low", "moderate", "high"].includes(String(row.intensity))
        ? String(row.intensity)
        : "moderate") as ExerciseLogRecord["intensity"],
      metValue: normalizeNumber(row.metValue),
      caloriesBurnedKcal: normalizeNumber(row.caloriesBurnedKcal),
      notes: row.notes ? String(row.notes) : undefined,
      createdAt: String(row.createdAt ?? nowIso()),
      updatedAt: String(row.updatedAt ?? nowIso())
    })) ?? [];

  const normalizeSleeps =
    (data.sleep_logs ?? []).map((row) => ({
      id: String(row.id ?? createId()),
      date: String(row.date ?? toDateKey(new Date())),
      sleepHours: normalizeNumber(row.sleepHours) ?? 0,
      sleepScore: normalizeNumber(row.sleepScore) ?? 5,
      sleepQualityText: String(row.sleepQualityText ?? ""),
      notes: row.notes ? String(row.notes) : undefined,
      createdAt: String(row.createdAt ?? nowIso()),
      updatedAt: String(row.updatedAt ?? nowIso())
    })) ?? [];

  const normalizeBodies =
    (data.body_metrics ?? []).map((row) => ({
      id: String(row.id ?? createId()),
      date: String(row.date ?? toDateKey(new Date())),
      weightKg: normalizeNumber(row.weightKg) ?? 0,
      bodyFatPct: normalizeNumber(row.bodyFatPct) ?? 0,
      waistCm: normalizeNumber(row.waistCm),
      restingHr: normalizeNumber(row.restingHr),
      notes: row.notes ? String(row.notes) : undefined,
      createdAt: String(row.createdAt ?? nowIso()),
      updatedAt: String(row.updatedAt ?? nowIso())
    })) ?? [];

  const normalizeReports =
    (data.report_snapshots ?? []).map((row) => ({
      id: String(row.id ?? createId()),
      periodType: (row.periodType === "weekly" ? "weekly" : "daily") as ReportSnapshotRecord["periodType"],
      periodStart: String(row.periodStart ?? toDateKey(new Date())),
      periodEnd: String(row.periodEnd ?? toDateKey(new Date())),
      summaryText: String(row.summaryText ?? ""),
      patterns: Array.isArray(row.patterns) ? row.patterns.map((item) => String(item)) : [],
      actions: Array.isArray(row.actions) ? row.actions.map((item) => String(item)) : [],
      createdAt: String(row.createdAt ?? nowIso())
    })) ?? [];

  await Promise.all([
    putRecords(LocalStores.profile, normalizeUserProfiles),
    putRecords(LocalStores.goals, normalizeGoals),
    putRecords(LocalStores.foodLogs, normalizeFoods),
    putRecords(LocalStores.exerciseLogs, normalizeExercises),
    putRecords(LocalStores.sleepLogs, normalizeSleeps),
    putRecords(LocalStores.bodyMetrics, normalizeBodies),
    putRecords(LocalStores.reports, normalizeReports)
  ]);

  inserted.user_profile = normalizeUserProfiles.length;
  inserted.goals = normalizeGoals.length;
  inserted.food_logs = normalizeFoods.length;
  inserted.exercise_logs = normalizeExercises.length;
  inserted.sleep_logs = normalizeSleeps.length;
  inserted.body_metrics = normalizeBodies.length;
  inserted.report_snapshots = normalizeReports.length;

  return inserted;
}

function toCsvSection(name: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    return `# ${name}\n(no rows)\n`;
  }
  const headers = Object.keys(rows[0]);
  const lines = [
    `# ${name}`,
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (value == null) return "";
          const text = typeof value === "string" ? value : JSON.stringify(value);
          return `"${text.replaceAll('"', '""')}"`;
        })
        .join(",")
    ),
    ""
  ];
  return lines.join("\n");
}

export async function exportLocalDataCsv(params: {
  rangeStart?: string;
  rangeEnd?: string;
}): Promise<string> {
  const payload = await exportLocalData(params);
  return [
    toCsvSection("user_profile", payload.user_profile as unknown as Record<string, unknown>[]),
    toCsvSection("goals", payload.goals as unknown as Record<string, unknown>[]),
    toCsvSection("food_logs", payload.food_logs as unknown as Record<string, unknown>[]),
    toCsvSection("exercise_logs", payload.exercise_logs as unknown as Record<string, unknown>[]),
    toCsvSection("sleep_logs", payload.sleep_logs as unknown as Record<string, unknown>[]),
    toCsvSection("body_metrics", payload.body_metrics as unknown as Record<string, unknown>[]),
    toCsvSection("report_snapshots", payload.report_snapshots as unknown as Record<string, unknown>[])
  ].join("\n");
}

export type LocalDashboardPayload = Awaited<ReturnType<typeof getDashboardLocal>>;

export function averageSleepScore(series: LocalDashboardPayload["series"]) {
  const values = series.map((point) => point.sleep_score).filter((v): v is number => v != null);
  return values.length === 0 ? 0 : average(values);
}
