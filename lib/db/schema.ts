import { real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const userProfile = sqliteTable("user_profile", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  dob: text("dob"),
  sex: text("sex"),
  heightCm: real("height_cm"),
  baselineActivityLevel: text("baseline_activity_level"),
  preferredUnits: text("preferred_units").notNull().default("metric"),
  currentWeightKg: real("current_weight_kg"),
  currentBodyFatPct: real("current_body_fat_pct"),
  waistCm: real("waist_cm"),
  restingHr: real("resting_hr"),
  goalPaceKgPerWeek: real("goal_pace_kg_per_week"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const goals = sqliteTable("goals", {
  id: text("id").primaryKey(),
  startDate: text("start_date").notNull(),
  targetDate: text("target_date").notNull(),
  targetWeightKg: real("target_weight_kg").notNull(),
  targetBodyFatPct: real("target_body_fat_pct"),
  targetPaceKgPerWeek: real("target_pace_kg_per_week"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const foodLogs = sqliteTable("food_logs", {
  id: text("id").primaryKey(),
  dateTime: text("date_time").notNull(),
  mealType: text("meal_type").notNull(),
  itemName: text("item_name").notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(),
  grams: real("grams"),
  caloriesKcal: real("calories_kcal"),
  proteinG: real("protein_g"),
  carbsG: real("carbs_g"),
  fatG: real("fat_g"),
  fiberG: real("fiber_g"),
  source: text("source").notNull(),
  sourceRef: text("source_ref"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const exerciseLogs = sqliteTable("exercise_logs", {
  id: text("id").primaryKey(),
  dateTime: text("date_time").notNull(),
  activityName: text("activity_name").notNull(),
  durationMin: real("duration_min").notNull(),
  intensity: text("intensity").notNull(),
  metValue: real("met_value"),
  caloriesBurnedKcal: real("calories_burned_kcal"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const sleepLogs = sqliteTable("sleep_logs", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  sleepHours: real("sleep_hours").notNull(),
  sleepScore: real("sleep_score_1_10").notNull(),
  sleepQualityText: text("sleep_quality_text").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const bodyMetrics = sqliteTable("body_metrics", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  weightKg: real("weight_kg").notNull(),
  bodyFatPct: real("body_fat_pct").notNull(),
  waistCm: real("waist_cm"),
  restingHr: real("resting_hr"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const reportSnapshots = sqliteTable("report_snapshots", {
  id: text("id").primaryKey(),
  periodType: text("period_type").notNull(),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  summaryText: text("summary_text").notNull(),
  actionsJson: text("actions_json").notNull(),
  patternsJson: text("patterns_json").notNull(),
  createdAt: text("created_at").notNull()
});

export const exportsTable = sqliteTable("exports", {
  id: text("id").primaryKey(),
  exportedAt: text("exported_at").notNull(),
  exportType: text("export_type").notNull(),
  rangeStart: text("range_start"),
  rangeEnd: text("range_end"),
  filePath: text("file_path").notNull()
});
