"use client";

import { FormEvent, useEffect, useState } from "react";

type Profile = {
  id?: string;
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
};

const emptyProfile: Profile = {
  name: "",
  preferredUnits: "metric"
};

export default function OnboardingPage() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/profile", { cache: "no-store" });
      const json = (await response.json()) as { data: any };
      if (json.data) {
        setProfile({
          name: json.data.name ?? "",
          dob: json.data.dob ?? undefined,
          sex: json.data.sex ?? undefined,
          heightCm: json.data.heightCm ?? undefined,
          baselineActivityLevel: json.data.baselineActivityLevel ?? undefined,
          preferredUnits: json.data.preferredUnits ?? "metric",
          currentWeightKg: json.data.currentWeightKg ?? undefined,
          currentBodyFatPct: json.data.currentBodyFatPct ?? undefined,
          waistCm: json.data.waistCm ?? undefined,
          restingHr: json.data.restingHr ?? undefined,
          goalPaceKgPerWeek: json.data.goalPaceKgPerWeek ?? undefined
        });
      }
    }
    void load();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          dob: profile.dob,
          sex: profile.sex,
          height_cm: profile.heightCm,
          baseline_activity_level: profile.baselineActivityLevel,
          preferred_units: profile.preferredUnits,
          current_weight_kg: profile.currentWeightKg,
          current_body_fat_pct: profile.currentBodyFatPct,
          waist_cm: profile.waistCm,
          resting_hr: profile.restingHr,
          goal_pace_kg_per_week: profile.goalPaceKgPerWeek
        })
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? `Failed (${response.status})`);
      }
      setMessage("Profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-brand-900">Profile Setup</h2>
        <p className="text-sm text-slate-700">
          Extended profile helps with calorie and burn estimations from free local formulas.
        </p>
      </div>

      {message && <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</p>}
      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <form className="card grid gap-3 md:grid-cols-2" onSubmit={submit}>
        <label className="text-sm">
          Name
          <input
            className="field"
            value={profile.name}
            onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
        </label>
        <label className="text-sm">
          DOB
          <input
            className="field"
            type="date"
            value={profile.dob ?? ""}
            onChange={(event) => setProfile((prev) => ({ ...prev, dob: event.target.value || undefined }))}
          />
        </label>
        <label className="text-sm">
          Sex
          <select
            className="field"
            value={profile.sex ?? ""}
            onChange={(event) =>
              setProfile((prev) => ({
                ...prev,
                sex: (event.target.value as "male" | "female" | "other" | "") || undefined
              }))
            }
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="text-sm">
          Height (cm)
          <input
            className="field"
            type="number"
            min={50}
            max={250}
            step="0.1"
            value={profile.heightCm ?? ""}
            onChange={(event) =>
              setProfile((prev) => ({
                ...prev,
                heightCm: event.target.value === "" ? undefined : Number(event.target.value)
              }))
            }
          />
        </label>
        <label className="text-sm">
          Activity Baseline
          <select
            className="field"
            value={profile.baselineActivityLevel ?? ""}
            onChange={(event) =>
              setProfile((prev) => ({
                ...prev,
                baselineActivityLevel:
                  (event.target.value as "sedentary" | "light" | "moderate" | "active" | "") ||
                  undefined
              }))
            }
          >
            <option value="">Select</option>
            <option value="sedentary">Sedentary</option>
            <option value="light">Light</option>
            <option value="moderate">Moderate</option>
            <option value="active">Active</option>
          </select>
        </label>
        <label className="text-sm">
          Preferred Units
          <select
            className="field"
            value={profile.preferredUnits}
            onChange={(event) =>
              setProfile((prev) => ({ ...prev, preferredUnits: event.target.value as "metric" | "imperial" }))
            }
          >
            <option value="metric">Metric</option>
            <option value="imperial">Imperial</option>
          </select>
        </label>
        <label className="text-sm">
          Current Weight (kg)
          <input
            className="field"
            type="number"
            min={1}
            step="0.1"
            value={profile.currentWeightKg ?? ""}
            onChange={(event) =>
              setProfile((prev) => ({
                ...prev,
                currentWeightKg: event.target.value === "" ? undefined : Number(event.target.value)
              }))
            }
          />
        </label>
        <label className="text-sm">
          Current Body Fat (%)
          <input
            className="field"
            type="number"
            min={1}
            max={80}
            step="0.1"
            value={profile.currentBodyFatPct ?? ""}
            onChange={(event) =>
              setProfile((prev) => ({
                ...prev,
                currentBodyFatPct: event.target.value === "" ? undefined : Number(event.target.value)
              }))
            }
          />
        </label>
        <label className="text-sm">
          Waist (cm)
          <input
            className="field"
            type="number"
            step="0.1"
            value={profile.waistCm ?? ""}
            onChange={(event) =>
              setProfile((prev) => ({
                ...prev,
                waistCm: event.target.value === "" ? undefined : Number(event.target.value)
              }))
            }
          />
        </label>
        <label className="text-sm">
          Resting HR
          <input
            className="field"
            type="number"
            step="1"
            value={profile.restingHr ?? ""}
            onChange={(event) =>
              setProfile((prev) => ({
                ...prev,
                restingHr: event.target.value === "" ? undefined : Number(event.target.value)
              }))
            }
          />
        </label>
        <label className="text-sm">
          Goal Pace (kg/week)
          <input
            className="field"
            type="number"
            min={0.1}
            max={2}
            step="0.1"
            value={profile.goalPaceKgPerWeek ?? ""}
            onChange={(event) =>
              setProfile((prev) => ({
                ...prev,
                goalPaceKgPerWeek: event.target.value === "" ? undefined : Number(event.target.value)
              }))
            }
          />
        </label>
        <div className="flex items-end">
          <button className="btn" type="submit">
            Save Profile
          </button>
        </div>
      </form>
    </section>
  );
}
