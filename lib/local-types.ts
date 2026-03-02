export type DashboardRange = "7d" | "30d" | "90d";
export type ReportPeriod = "daily" | "weekly";

export type UserProfileRecord = {
  id: string;
  name: string;
  dob?: string;
  sex?: "male" | "female" | "other";
  heightCm?: number;
  baselineActivityLevel?: "sedentary" | "light" | "moderate" | "active";
  preferredUnits: "metric" | "imperial";
  currentWeightKg?: number;
  currentBodyFatPct?: number;
  waistCm?: number;
  restingHr?: number;
  goalPaceKgPerWeek?: number;
  createdAt: string;
  updatedAt: string;
};

export type GoalRecord = {
  id: string;
  startDate: string;
  targetDate: string;
  targetWeightKg: number;
  targetBodyFatPct?: number;
  targetPaceKgPerWeek?: number;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
};

export type FoodSource = "manual" | "usda" | "openfoodfacts" | "mixed";

export type FoodLogRecord = {
  id: string;
  dateTime: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  itemName: string;
  quantity: number;
  unit: string;
  grams?: number;
  caloriesKcal?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  fiberG?: number;
  source: FoodSource;
  sourceRef?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type ExerciseLogRecord = {
  id: string;
  dateTime: string;
  activityName: string;
  durationMin: number;
  intensity: "low" | "moderate" | "high";
  metValue?: number;
  caloriesBurnedKcal?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type SleepLogRecord = {
  id: string;
  date: string;
  sleepHours: number;
  sleepScore: number;
  sleepQualityText: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type BodyMetricRecord = {
  id: string;
  date: string;
  weightKg: number;
  bodyFatPct: number;
  waistCm?: number;
  restingHr?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type ReportSnapshotRecord = {
  id: string;
  periodType: ReportPeriod;
  periodStart: string;
  periodEnd: string;
  summaryText: string;
  patterns: string[];
  actions: string[];
  createdAt: string;
};

export type LocalExportPayload = {
  exported_at: string;
  range_start: string | null;
  range_end: string | null;
  user_profile: UserProfileRecord[];
  goals: GoalRecord[];
  food_logs: FoodLogRecord[];
  exercise_logs: ExerciseLogRecord[];
  sleep_logs: SleepLogRecord[];
  body_metrics: BodyMetricRecord[];
  report_snapshots: ReportSnapshotRecord[];
};
