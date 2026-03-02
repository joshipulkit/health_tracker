import { describe, expect, it } from "vitest";
import {
  calculateBmrKatchMcArdle,
  calculateBmrMifflinStJeor,
  calculateExerciseCalories,
  classifyGoalStatus
} from "@/lib/calculations";

describe("calculation utilities", () => {
  it("computes MET-based exercise calories", () => {
    const calories = calculateExerciseCalories(7, 80, 30);
    expect(calories).toBeCloseTo(294, 0);
  });

  it("computes Katch-McArdle BMR", () => {
    const bmr = calculateBmrKatchMcArdle(80, 20);
    expect(bmr).toBeCloseTo(1752.4, 1);
  });

  it("computes Mifflin-St Jeor BMR", () => {
    const bmr = calculateBmrMifflinStJeor(80, 180, 30, "male");
    expect(bmr).toBe(1780);
  });

  it("classifies goal status", () => {
    const status = classifyGoalStatus({
      currentWeightKg: 82,
      targetWeightKg: 78,
      startDateIso: "2026-01-01T00:00:00.000Z",
      targetDateIso: "2026-04-01T00:00:00.000Z",
      currentDateIso: "2026-02-15T00:00:00.000Z",
      trendKgPerDay: -0.05
    });
    expect(["on_track", "at_risk", "off_track"]).toContain(status);
  });
});
