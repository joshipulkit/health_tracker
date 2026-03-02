"use client";

import { FormEvent, useEffect, useState } from "react";
import { getProfile, saveProfile } from "@/lib/local-store";

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
      const data = await getProfile();
      if (data) {
        setProfile({
          id: data.id,
          name: data.name,
          dob: data.dob,
          sex: data.sex,
          heightCm: data.heightCm,
          baselineActivityLevel: data.baselineActivityLevel,
          preferredUnits: data.preferredUnits,
          currentWeightKg: data.currentWeightKg,
          currentBodyFatPct: data.currentBodyFatPct,
          waistCm: data.waistCm,
          restingHr: data.restingHr,
          goalPaceKgPerWeek: data.goalPaceKgPerWeek
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
      await saveProfile({
        id: profile.id,
        name: profile.name,
        dob: profile.dob,
        sex: profile.sex,
        heightCm: profile.heightCm,
        baselineActivityLevel: profile.baselineActivityLevel,
        preferredUnits: profile.preferredUnits,
        currentWeightKg: profile.currentWeightKg,
        currentBodyFatPct: profile.currentBodyFatPct,
        waistCm: profile.waistCm,
        restingHr: profile.restingHr,
        goalPaceKgPerWeek: profile.goalPaceKgPerWeek
      });
      setMessage("Profile saved locally on this device.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    }
  }

  return (
    <section className="space-y-6">
      <div className="section-head">
        <h2 className="text-3xl font-semibold text-brand-900">Profile Setup</h2>
        <p className="text-sm text-slate-700">
          Extended profile helps with local calorie and burn estimations. Data stays on this device.
        </p>
      </div>

      {message && <p className="alert-success">{message}</p>}
      {error && <p className="alert-error">{error}</p>}

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
