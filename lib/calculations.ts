type Sex = "male" | "female" | "other";

export function calculateExerciseCalories(
  metValue: number,
  weightKg: number,
  durationMin: number
): number {
  return Number(((metValue * 3.5 * weightKg) / 200) * durationMin);
}

export function calculateBmrKatchMcArdle(weightKg: number, bodyFatPct: number): number {
  const leanMass = weightKg * (1 - bodyFatPct / 100);
  return 370 + 21.6 * leanMass;
}

export function calculateBmrMifflinStJeor(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  sex: Sex
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  if (sex === "male") {
    return base + 5;
  }
  if (sex === "female") {
    return base - 161;
  }
  return base - 78;
}

export function tdeeFromBmr(bmr: number, activityLevel: "sedentary" | "light" | "moderate" | "active") {
  const multiplier = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725
  }[activityLevel];

  return bmr * multiplier;
}

export function linearSlope(values: Array<{ x: number; y: number }>): number {
  if (values.length < 2) {
    return 0;
  }

  const n = values.length;
  const sumX = values.reduce((acc, point) => acc + point.x, 0);
  const sumY = values.reduce((acc, point) => acc + point.y, 0);
  const sumXY = values.reduce((acc, point) => acc + point.x * point.y, 0);
  const sumXX = values.reduce((acc, point) => acc + point.x * point.x, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = n * sumXX - sumX * sumX;

  if (denominator === 0) {
    return 0;
  }
  return numerator / denominator;
}

export function classifyGoalStatus(params: {
  currentWeightKg: number;
  targetWeightKg: number;
  targetDateIso: string;
  startDateIso: string;
  currentDateIso?: string;
  trendKgPerDay: number;
}): "on_track" | "at_risk" | "off_track" {
  const now = params.currentDateIso ? new Date(params.currentDateIso) : new Date();
  const targetDate = new Date(params.targetDateIso);
  const startDate = new Date(params.startDateIso);

  const totalDays = Math.max(
    1,
    Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const elapsedDays = Math.max(
    1,
    Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  const requiredDailyChange = (params.targetWeightKg - params.currentWeightKg) / Math.max(
    1,
    totalDays - elapsedDays
  );
  const delta = Math.abs(params.trendKgPerDay - requiredDailyChange);

  if (delta <= 0.05) {
    return "on_track";
  }
  if (delta <= 0.12) {
    return "at_risk";
  }
  return "off_track";
}

export function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
