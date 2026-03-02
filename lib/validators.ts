import { z } from "zod";

const optionalNumber = z
  .number({
    invalid_type_error: "Must be a number"
  })
  .finite()
  .optional()
  .nullable()
  .transform((value) => (value == null ? undefined : value));

export const foodLogSchema = z.object({
  date_time: z.string().datetime(),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  item_name: z.string().min(1).max(160),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(30),
  grams: optionalNumber,
  calories_kcal: optionalNumber,
  protein_g: optionalNumber,
  carbs_g: optionalNumber,
  fat_g: optionalNumber,
  fiber_g: optionalNumber,
  source: z.enum(["manual", "usda", "openfoodfacts", "mixed"]).default("manual"),
  source_ref: z.string().max(200).optional(),
  notes: z.string().max(1000).optional()
});
export const idSchema = z.object({
  id: z.string().uuid()
});
export const foodLogUpdateSchema = foodLogSchema.extend({
  id: z.string().uuid()
});

export const exerciseLogSchema = z.object({
  date_time: z.string().datetime(),
  activity_name: z.string().min(1).max(120),
  duration_min: z.number().positive(),
  intensity: z.enum(["low", "moderate", "high"]),
  met_value: optionalNumber,
  calories_burned_kcal: optionalNumber,
  notes: z.string().max(1000).optional()
});
export const exerciseLogUpdateSchema = exerciseLogSchema.extend({
  id: z.string().uuid()
});

export const sleepLogSchema = z.object({
  date: z.string().date(),
  sleep_hours: z.number().min(0).max(24),
  sleep_score_1_10: z.number().min(1).max(10),
  sleep_quality_text: z.string().min(1).max(1000),
  notes: z.string().max(1000).optional()
});
export const sleepLogUpdateSchema = sleepLogSchema.extend({
  id: z.string().uuid()
});

export const bodyMetricSchema = z.object({
  date: z.string().date(),
  weight_kg: z.number().positive().max(500),
  body_fat_pct: z.number().min(1).max(80),
  waist_cm: optionalNumber,
  resting_hr: optionalNumber,
  notes: z.string().max(1000).optional()
});
export const bodyMetricUpdateSchema = bodyMetricSchema.extend({
  id: z.string().uuid()
});

export const goalSchema = z.object({
  start_date: z.string().date(),
  target_date: z.string().date(),
  target_weight_kg: z.number().positive().max(500),
  target_body_fat_pct: optionalNumber,
  target_pace_kg_per_week: optionalNumber
});

export const profileSchema = z.object({
  name: z.string().min(1).max(80),
  dob: z.string().date().optional(),
  sex: z.enum(["male", "female", "other"]).optional(),
  height_cm: z.number().positive().max(250).optional(),
  baseline_activity_level: z.enum(["sedentary", "light", "moderate", "active"]).optional(),
  preferred_units: z.enum(["metric", "imperial"]).default("metric"),
  current_weight_kg: optionalNumber,
  current_body_fat_pct: optionalNumber,
  waist_cm: optionalNumber,
  resting_hr: optionalNumber,
  goal_pace_kg_per_week: optionalNumber
});

export const exportSchema = z.object({
  format: z.enum(["json", "csv"]),
  range_start: z.string().date().optional(),
  range_end: z.string().date().optional()
});

export const importSchema = z.object({
  mode: z.enum(["append", "replace"]).default("append"),
  payload: z.record(z.string(), z.unknown())
});

export const reportPeriodSchema = z.object({
  period: z.enum(["daily", "weekly"]).default("daily")
});

export const nutritionSearchSchema = z.object({
  query: z.string().min(2).max(120)
});
