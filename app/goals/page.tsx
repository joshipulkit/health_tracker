"use client";

import { FormEvent, useEffect, useState } from "react";
import type { GoalRecord } from "@/lib/local-types";
import { getGoals, saveGoal } from "@/lib/local-store";

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString().slice(0, 10)
  );
  const [targetWeight, setTargetWeight] = useState<number>(75);
  const [targetBodyFat, setTargetBodyFat] = useState<number | "">(18);
  const [pace, setPace] = useState<number | "">(0.5);

  async function loadGoals() {
    const rows = await getGoals();
    setGoals(rows);
  }

  useEffect(() => {
    void loadGoals();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await saveGoal({
        startDate,
        targetDate,
        targetWeightKg: targetWeight,
        targetBodyFatPct: targetBodyFat === "" ? undefined : targetBodyFat,
        targetPaceKgPerWeek: pace === "" ? undefined : pace
      });
      setMessage("Goal saved locally for this device.");
      await loadGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save goal");
    }
  }

  return (
    <section className="space-y-6">
      <div className="section-head">
        <h2 className="text-3xl font-semibold text-brand-900">Goals</h2>
        <p className="text-sm text-slate-700">Set timeline-based targets for weight and body fat percentage.</p>
      </div>

      {message && <p className="alert-success">{message}</p>}
      {error && <p className="alert-error">{error}</p>}

      <form className="card grid gap-3 md:grid-cols-2" onSubmit={submit}>
        <label className="text-sm">
          Start Date
          <input
            className="field"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            required
          />
        </label>
        <label className="text-sm">
          Target Date
          <input
            className="field"
            type="date"
            value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)}
            required
          />
        </label>
        <label className="text-sm">
          Target Weight (kg)
          <input
            className="field"
            type="number"
            min={1}
            step="0.1"
            value={targetWeight}
            onChange={(event) => setTargetWeight(Number(event.target.value))}
            required
          />
        </label>
        <label className="text-sm">
          Target Body Fat (%)
          <input
            className="field"
            type="number"
            min={1}
            max={80}
            step="0.1"
            value={targetBodyFat}
            onChange={(event) => setTargetBodyFat(event.target.value === "" ? "" : Number(event.target.value))}
          />
        </label>
        <label className="text-sm">
          Target Pace (kg/week)
          <input
            className="field"
            type="number"
            min={0.1}
            max={2}
            step="0.1"
            value={pace}
            onChange={(event) => setPace(event.target.value === "" ? "" : Number(event.target.value))}
          />
        </label>
        <div className="flex items-end">
          <button className="btn" type="submit">
            Save Goal
          </button>
        </div>
      </form>

      <div className="card">
        <h3 className="text-lg font-semibold">Goal History</h3>
        <p className="mt-1 text-xs text-slate-600">Stored only on this device.</p>
        {goals.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No goals saved yet.</p>
        ) : (
          <div className="mt-3 overflow-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-brand-200 text-slate-600">
                  <th className="py-2">Status</th>
                  <th className="py-2">Start</th>
                  <th className="py-2">Target</th>
                  <th className="py-2">Target Weight</th>
                  <th className="py-2">Target BF %</th>
                  <th className="py-2">Pace</th>
                </tr>
              </thead>
              <tbody>
                {goals.map((goal) => (
                  <tr key={goal.id} className="border-b border-brand-100">
                    <td className="py-2 capitalize">{goal.status}</td>
                    <td className="py-2">{goal.startDate}</td>
                    <td className="py-2">{goal.targetDate}</td>
                    <td className="py-2">{goal.targetWeightKg.toFixed(1)} kg</td>
                    <td className="py-2">{goal.targetBodyFatPct?.toFixed(1) ?? "-"}</td>
                    <td className="py-2">{goal.targetPaceKgPerWeek?.toFixed(1) ?? "-"} kg/wk</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
