import { average, linearSlope } from "@/lib/calculations";

type DailyAggregate = {
  date: string;
  caloriesIn: number;
  caloriesOut: number;
  proteinG: number;
  sleepScore: number | null;
  didWorkout: boolean;
  weightKg: number | null;
  bodyFatPct: number | null;
};

export type ReportOutput = {
  summary: string;
  patterns: string[];
  actions: string[];
};

export function generateRuleBasedReport(
  days: DailyAggregate[],
  opts?: { targetProteinG?: number; tdeeKcal?: number }
): ReportOutput {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const targetProteinG = opts?.targetProteinG ?? 130;

  const patterns: string[] = [];
  const actions: string[] = [];

  const calorieBalances = sorted.map((d) => d.caloriesIn - d.caloriesOut);
  const calorieIntakes = sorted.map((d) => d.caloriesIn);
  const avgBalance = average(calorieBalances);
  const avgIntake = average(calorieIntakes);

  const weightPoints = sorted
    .filter((d) => d.weightKg != null)
    .map((d, idx) => ({ x: idx, y: d.weightKg as number }));
  const bodyFatPoints = sorted
    .filter((d) => d.bodyFatPct != null)
    .map((d, idx) => ({ x: idx, y: d.bodyFatPct as number }));
  const sleepScores = sorted.filter((d) => d.sleepScore != null).map((d) => d.sleepScore as number);
  const proteinLowDays = sorted.filter((d) => d.proteinG > 0 && d.proteinG < targetProteinG).length;
  const workoutDays = sorted.filter((d) => d.didWorkout).length;

  const weightSlope = linearSlope(weightPoints);
  const bodyFatSlope = linearSlope(bodyFatPoints);

  const likelySurplus =
    opts?.tdeeKcal != null ? avgIntake > opts.tdeeKcal + 200 : avgBalance > 250;

  if (likelySurplus && weightSlope > 0.03) {
    patterns.push("7-day calorie surplus is high and weight trend is climbing.");
    actions.push(
      "Cut daily intake by 250-350 kcal for the next 7 days and remove one high-calorie snack category."
    );
  }

  if (sleepScores.length >= 4) {
    const firstHalf = sleepScores.slice(0, Math.floor(sleepScores.length / 2));
    const secondHalf = sleepScores.slice(Math.floor(sleepScores.length / 2));
    const sleepDrop = average(firstHalf) - average(secondHalf);
    if (sleepDrop > 1.5 && workoutDays <= 2) {
      patterns.push("Sleep score dropped significantly while workout consistency also fell.");
      actions.push(
        "Enforce a fixed sleep window tonight and keep tomorrow as low-intensity recovery (walk + mobility)."
      );
    }
  }

  if (proteinLowDays >= Math.min(5, sorted.length)) {
    patterns.push("Protein intake stayed below target on most logged days.");
    actions.push(
      "Add one protein anchor to every meal tomorrow (30-40g per meal minimum) and verify totals before sleep."
    );
  }

  if (Math.abs(bodyFatSlope) < 0.01 && weightSlope < -0.12) {
    patterns.push("Weight is dropping quickly while body-fat trend is flat.");
    actions.push(
      "Slow the deficit immediately: add 150-250 kcal and prioritize resistance training to protect lean mass."
    );
  }

  if (workoutDays < 3 && sorted.length >= 7) {
    patterns.push("Training frequency is too low for your current fat-loss target.");
    actions.push(
      "Schedule 3 fixed workout slots for next week now; treat them as non-negotiable calendar blocks."
    );
  }

  if (actions.length < 3) {
    actions.push("Pre-log tomorrow's meals tonight and keep the day within your calorie target.");
  }
  if (actions.length < 3) {
    actions.push("Hit at least 8,000 steps tomorrow even if no formal workout happens.");
  }
  if (actions.length < 3) {
    actions.push("Set a hard cutoff for eating 2-3 hours before bedtime to improve recovery.");
  }

  const summary = [
    "Performance check:",
    avgBalance > 0
      ? `Average daily calorie balance is +${Math.round(avgBalance)} kcal.`
      : `Average daily calorie balance is ${Math.round(avgBalance)} kcal.`,
    weightPoints.length > 1
      ? `Weight trend slope is ${weightSlope.toFixed(3)} kg/day.`
      : "Not enough weight data for trend.",
    sleepScores.length > 0 ? `Average sleep score is ${average(sleepScores).toFixed(1)}/10.` : ""
  ]
    .filter(Boolean)
    .join(" ");

  return {
    summary,
    patterns: patterns.length > 0 ? patterns : ["No strong adverse pattern detected in this window."],
    actions: actions.slice(0, 5)
  };
}
