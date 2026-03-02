export const metByActivity: Record<string, number> = {
  walking: 3.5,
  jogging: 7.0,
  running: 9.8,
  cycling: 7.5,
  weight_training: 5.0,
  hiit: 8.0,
  yoga: 2.5,
  swimming: 6.0,
  soccer: 7.0,
  basketball: 6.5
};

export function inferMetValue(activityName: string, intensity: "low" | "moderate" | "high"): number {
  const key = activityName.trim().toLowerCase().replace(/\s+/g, "_");
  const base = metByActivity[key] ?? 4;
  const intensityFactor = intensity === "low" ? 0.85 : intensity === "high" ? 1.2 : 1;
  return Number((base * intensityFactor).toFixed(2));
}
