"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type DashboardResponse = {
  range: "7d" | "30d" | "90d";
  series: Array<{
    date: string;
    calories_in: number;
    calories_out: number;
    protein_g: number;
    sleep_score: number | null;
    sleep_hours: number | null;
    weight_kg: number | null;
    body_fat_pct: number | null;
    exercise_sessions: number;
  }>;
  adherence: {
    workout_days: number;
    logged_days: number;
    protein_target_hit_days: number;
  };
  goal_status: {
    status: "on_track" | "at_risk" | "off_track" | "no_goal";
    details: string;
  };
};

const ranges: Array<"7d" | "30d" | "90d"> = ["7d", "30d", "90d"];

export default function DashboardPage() {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/dashboard?range=${range}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load dashboard (${response.status})`);
        }
        const json = (await response.json()) as DashboardResponse;
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [range]);

  const totals = useMemo(() => {
    if (!data) {
      return {
        caloriesIn: 0,
        caloriesOut: 0,
        avgSleep: 0
      };
    }
    const caloriesIn = data.series.reduce((sum, point) => sum + point.calories_in, 0);
    const caloriesOut = data.series.reduce((sum, point) => sum + point.calories_out, 0);
    const sleepValues = data.series
      .map((point) => point.sleep_score)
      .filter((value): value is number => value != null);
    const avgSleep =
      sleepValues.length > 0
        ? sleepValues.reduce((sum, value) => sum + value, 0) / sleepValues.length
        : 0;
    return { caloriesIn, caloriesOut, avgSleep };
  }, [data]);

  return (
    <section className="space-y-6">
      <div className="section-head flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-brand-700">Overview</p>
          <h2 className="text-3xl font-semibold text-brand-900">Dashboard</h2>
          <p className="text-sm text-slate-700">
            Track weight, body fat, intake, burn, sleep, and consistency.
          </p>
        </div>
        <div className="flex gap-2">
          {ranges.map((value) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={value === range ? "btn" : "btn-secondary"}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm">Loading dashboard…</p>}
      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="card-hero">
              <p className="text-xs uppercase tracking-wide text-slate-500">Calories In</p>
              <p className="mt-1 text-2xl font-semibold">{Math.round(totals.caloriesIn)} kcal</p>
            </div>
            <div className="card-hero">
              <p className="text-xs uppercase tracking-wide text-slate-500">Calories Out</p>
              <p className="mt-1 text-2xl font-semibold">{Math.round(totals.caloriesOut)} kcal</p>
            </div>
            <div className="card-hero">
              <p className="text-xs uppercase tracking-wide text-slate-500">Avg Sleep Score</p>
              <p className="mt-1 text-2xl font-semibold">{totals.avgSleep.toFixed(1)} / 10</p>
            </div>
            <div className="card-hero">
              <p className="text-xs uppercase tracking-wide text-slate-500">Goal Status</p>
              <p className="mt-1 text-lg font-semibold capitalize">{data.goal_status.status.replace("_", " ")}</p>
              <p className="text-xs text-slate-600">{data.goal_status.details}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card">
              <h3 className="text-sm font-semibold">Weight vs Body Fat</h3>
              <div className="mt-3 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.series}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="weight_kg" stroke="#3a7d44" name="Weight (kg)" />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="body_fat_pct"
                      stroke="#f59e0b"
                      name="Body Fat %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <h3 className="text-sm font-semibold">Calories In vs Out</h3>
              <div className="mt-3 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.series}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="calories_in" stroke="#2563eb" name="Calories In" />
                    <Line type="monotone" dataKey="calories_out" stroke="#dc2626" name="Calories Out" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold">Adherence Snapshot</h3>
            <div className="mt-2 grid gap-3 text-sm md:grid-cols-3">
              <p>Workout days: {data.adherence.workout_days}</p>
              <p>Logged days: {data.adherence.logged_days}</p>
              <p>Protein target days: {data.adherence.protein_target_hit_days}</p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
