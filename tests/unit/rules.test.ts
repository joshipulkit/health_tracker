import { describe, expect, it } from "vitest";
import { generateRuleBasedReport } from "@/lib/rules";

describe("rule-based report", () => {
  it("always returns at least 3 actions", () => {
    const report = generateRuleBasedReport(
      Array.from({ length: 7 }).map((_, idx) => ({
        date: `2026-03-0${idx + 1}`,
        caloriesIn: 2500,
        caloriesOut: 1800,
        proteinG: 90,
        sleepScore: 6,
        didWorkout: idx % 3 === 0,
        weightKg: 82 + idx * 0.05,
        bodyFatPct: 24.5
      }))
    );

    expect(report.actions.length).toBeGreaterThanOrEqual(3);
    expect(report.summary.length).toBeGreaterThan(0);
    expect(report.patterns.length).toBeGreaterThan(0);
  });
});
