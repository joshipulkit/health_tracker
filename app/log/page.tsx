"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type {
  BodyMetricRecord,
  ExerciseLogRecord,
  FoodLogRecord,
  FoodSource,
  SleepLogRecord
} from "@/lib/local-types";
import {
  deleteBodyMetric,
  deleteExerciseLog,
  deleteFoodLog,
  deleteSleepLog,
  listLogsForDateWindow,
  saveBodyMetric,
  saveExerciseLog,
  saveFoodLog,
  saveSleepLog
} from "@/lib/local-store";

type NutritionCandidate = {
  source: "usda" | "openfoodfacts" | "manual";
  sourceRef: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
};

const mealOptions = ["breakfast", "lunch", "dinner", "snack"] as const;
const intensityOptions = ["low", "moderate", "high"] as const;
const feedTabs = ["all", "food", "exercise", "sleep", "body"] as const;
type FeedTab = (typeof feedTabs)[number];

type MealType = (typeof mealOptions)[number];
type Intensity = (typeof intensityOptions)[number];

function localDateTimeInputFromDate(date: Date): string {
  const normalized = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return normalized.toISOString().slice(0, 16);
}

function localDateInputFromDate(date: Date): string {
  const normalized = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return normalized.toISOString().slice(0, 10);
}

function localDateTimeToIso(input: string): string {
  return new Date(input).toISOString();
}

function isoToLocalDateTimeInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return localDateTimeInputFromDate(new Date());
  }
  return localDateTimeInputFromDate(date);
}

export default function LogPage() {
  const now = new Date();

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState(localDateInputFromDate(now));
  const [windowMode, setWindowMode] = useState<"day" | "week">("day");
  const [activeFeedTab, setActiveFeedTab] = useState<FeedTab>("all");

  const [logsLoading, setLogsLoading] = useState(false);
  const [foodLogs, setFoodLogs] = useState<FoodLogRecord[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogRecord[]>([]);
  const [sleepLogs, setSleepLogs] = useState<SleepLogRecord[]>([]);
  const [bodyLogs, setBodyLogs] = useState<BodyMetricRecord[]>([]);

  const [nutritionQuery, setNutritionQuery] = useState("");
  const [nutritionOptions, setNutritionOptions] = useState<NutritionCandidate[]>([]);
  const [selectedNutrition, setSelectedNutrition] = useState<NutritionCandidate | null>(null);

  const [foodEditId, setFoodEditId] = useState<string | null>(null);
  const [exerciseEditId, setExerciseEditId] = useState<string | null>(null);
  const [sleepEditId, setSleepEditId] = useState<string | null>(null);
  const [bodyEditId, setBodyEditId] = useState<string | null>(null);

  const [foodDateTime, setFoodDateTime] = useState(localDateTimeInputFromDate(now));
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState("serving");
  const [grams, setGrams] = useState<number>(100);
  const [calories, setCalories] = useState<number | "">("");
  const [protein, setProtein] = useState<number | "">("");
  const [carbs, setCarbs] = useState<number | "">("");
  const [fat, setFat] = useState<number | "">("");
  const [fiber, setFiber] = useState<number | "">("");
  const [foodSource, setFoodSource] = useState<FoodSource>("manual");
  const [foodSourceRef, setFoodSourceRef] = useState<string | undefined>(undefined);

  const [exerciseDateTime, setExerciseDateTime] = useState(localDateTimeInputFromDate(now));
  const [activityName, setActivityName] = useState("walking");
  const [duration, setDuration] = useState<number>(30);
  const [intensity, setIntensity] = useState<Intensity>("moderate");
  const [exerciseCalories, setExerciseCalories] = useState<number | "">("");

  const [sleepDate, setSleepDate] = useState(localDateInputFromDate(now));
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [sleepScore, setSleepScore] = useState<number>(7);
  const [sleepText, setSleepText] = useState("Slept okay");

  const [bodyDate, setBodyDate] = useState(localDateInputFromDate(now));
  const [weight, setWeight] = useState<number>(80);
  const [bodyFat, setBodyFat] = useState<number>(25);
  const [waist, setWaist] = useState<number | "">("");
  const [restingHr, setRestingHr] = useState<number | "">("");

  const foodPreview = useMemo(() => {
    if (!selectedNutrition || !grams) {
      return null;
    }
    const factor = grams / 100;
    return {
      calories: Number((selectedNutrition.caloriesPer100g * factor).toFixed(2)),
      protein: Number((selectedNutrition.proteinPer100g * factor).toFixed(2)),
      carbs: Number((selectedNutrition.carbsPer100g * factor).toFixed(2)),
      fat: Number((selectedNutrition.fatPer100g * factor).toFixed(2)),
      fiber: Number((selectedNutrition.fiberPer100g * factor).toFixed(2))
    };
  }, [selectedNutrition, grams]);

  const feedCounts = useMemo(
    () => ({
      food: foodLogs.length,
      exercise: exerciseLogs.length,
      sleep: sleepLogs.length,
      body: bodyLogs.length
    }),
    [foodLogs.length, exerciseLogs.length, sleepLogs.length, bodyLogs.length]
  );

  const selectedRangeSummary = useMemo(() => {
    const foodCalories = foodLogs.reduce((sum, row) => sum + (row.caloriesKcal ?? 0), 0);
    const burnCalories = exerciseLogs.reduce((sum, row) => sum + (row.caloriesBurnedKcal ?? 0), 0);
    const latestWeight = bodyLogs[0]?.weightKg;
    return {
      foodCalories,
      burnCalories,
      latestWeight
    };
  }, [foodLogs, exerciseLogs, bodyLogs]);

  async function loadLogs() {
    setLogsLoading(true);
    setError(null);
    try {
      const data = await listLogsForDateWindow(selectedDate, windowMode);
      setFoodLogs(data.food);
      setExerciseLogs(data.exercise);
      setSleepLogs(data.sleep);
      setBodyLogs(data.body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logs");
    } finally {
      setLogsLoading(false);
    }
  }

  useEffect(() => {
    void loadLogs();
  }, [selectedDate, windowMode]);

  function resetFoodForm() {
    setFoodEditId(null);
    setFoodDateTime(localDateTimeInputFromDate(new Date()));
    setMealType("lunch");
    setItemName("");
    setQuantity(1);
    setUnit("serving");
    setGrams(100);
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setFiber("");
    setSelectedNutrition(null);
    setNutritionOptions([]);
    setNutritionQuery("");
    setFoodSource("manual");
    setFoodSourceRef(undefined);
  }

  function resetExerciseForm() {
    setExerciseEditId(null);
    setExerciseDateTime(localDateTimeInputFromDate(new Date()));
    setActivityName("walking");
    setDuration(30);
    setIntensity("moderate");
    setExerciseCalories("");
  }

  function resetSleepForm() {
    setSleepEditId(null);
    setSleepDate(localDateInputFromDate(new Date()));
    setSleepHours(7.5);
    setSleepScore(7);
    setSleepText("Slept okay");
  }

  function resetBodyForm() {
    setBodyEditId(null);
    setBodyDate(localDateInputFromDate(new Date()));
    setWeight(80);
    setBodyFat(25);
    setWaist("");
    setRestingHr("");
  }

  async function submitFood(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    try {
      await saveFoodLog({
        id: foodEditId ?? undefined,
        dateTime: localDateTimeToIso(foodDateTime),
        mealType,
        itemName,
        quantity,
        unit,
        grams: grams || undefined,
        caloriesKcal: calories === "" ? foodPreview?.calories : calories,
        proteinG: protein === "" ? foodPreview?.protein : protein,
        carbsG: carbs === "" ? foodPreview?.carbs : carbs,
        fatG: fat === "" ? foodPreview?.fat : fat,
        fiberG: fiber === "" ? foodPreview?.fiber : fiber,
        source: foodSource,
        sourceRef: foodSourceRef
      });

      setMessage(foodEditId ? "Food entry updated." : "Food entry saved.");
      if (foodEditId) {
        resetFoodForm();
      } else {
        setItemName("");
        setSelectedNutrition(null);
        setNutritionOptions([]);
        setNutritionQuery("");
        setFoodSource("manual");
        setFoodSourceRef(undefined);
      }
      await loadLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save food entry");
    }
  }

  async function searchNutrition() {
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/nutrition/search?query=${encodeURIComponent(nutritionQuery)}`);
      const json = (await response.json()) as { data: NutritionCandidate[]; error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? `Search failed (${response.status})`);
      }
      setNutritionOptions(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nutrition search failed");
    }
  }

  async function submitExercise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    try {
      await saveExerciseLog({
        id: exerciseEditId ?? undefined,
        dateTime: localDateTimeToIso(exerciseDateTime),
        activityName,
        durationMin: duration,
        intensity,
        caloriesBurnedKcal: exerciseCalories === "" ? undefined : exerciseCalories
      });
      setMessage(exerciseEditId ? "Exercise entry updated." : "Exercise entry saved.");
      if (exerciseEditId) {
        resetExerciseForm();
      }
      await loadLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save exercise entry");
    }
  }

  async function submitSleep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    try {
      await saveSleepLog({
        id: sleepEditId ?? undefined,
        date: sleepDate,
        sleepHours,
        sleepScore,
        sleepQualityText: sleepText
      });
      setMessage(sleepEditId ? "Sleep entry updated." : "Sleep entry saved.");
      if (sleepEditId) {
        resetSleepForm();
      }
      await loadLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save sleep entry");
    }
  }

  async function submitBody(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    try {
      await saveBodyMetric({
        id: bodyEditId ?? undefined,
        date: bodyDate,
        weightKg: weight,
        bodyFatPct: bodyFat,
        waistCm: waist === "" ? undefined : waist,
        restingHr: restingHr === "" ? undefined : restingHr
      });
      setMessage(bodyEditId ? "Body entry updated." : "Body entry saved.");
      if (bodyEditId) {
        resetBodyForm();
      }
      await loadLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save body entry");
    }
  }

  async function removeEntry(type: "food" | "exercise" | "sleep" | "body", id: string) {
    const ok = window.confirm("Delete this entry? This action cannot be undone.");
    if (!ok) return;

    setMessage(null);
    setError(null);

    try {
      if (type === "food") await deleteFoodLog(id);
      if (type === "exercise") await deleteExerciseLog(id);
      if (type === "sleep") await deleteSleepLog(id);
      if (type === "body") await deleteBodyMetric(id);
      setMessage("Entry deleted.");
      await loadLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    }
  }

  function beginFoodEdit(row: FoodLogRecord) {
    setFoodEditId(row.id);
    setFoodDateTime(isoToLocalDateTimeInput(row.dateTime));
    setMealType(row.mealType);
    setItemName(row.itemName);
    setQuantity(row.quantity);
    setUnit(row.unit);
    setGrams(row.grams ?? 100);
    setCalories(row.caloriesKcal ?? "");
    setProtein(row.proteinG ?? "");
    setCarbs(row.carbsG ?? "");
    setFat(row.fatG ?? "");
    setFiber(row.fiberG ?? "");
    setFoodSource(row.source);
    setFoodSourceRef(row.sourceRef ?? undefined);
    setSelectedNutrition(null);
    setMessage("Food entry loaded in form for editing.");
  }

  function beginExerciseEdit(row: ExerciseLogRecord) {
    setExerciseEditId(row.id);
    setExerciseDateTime(isoToLocalDateTimeInput(row.dateTime));
    setActivityName(row.activityName);
    setDuration(row.durationMin);
    setIntensity(row.intensity);
    setExerciseCalories(row.caloriesBurnedKcal ?? "");
    setMessage("Exercise entry loaded in form for editing.");
  }

  function beginSleepEdit(row: SleepLogRecord) {
    setSleepEditId(row.id);
    setSleepDate(row.date);
    setSleepHours(row.sleepHours);
    setSleepScore(row.sleepScore);
    setSleepText(row.sleepQualityText);
    setMessage("Sleep entry loaded in form for editing.");
  }

  function beginBodyEdit(row: BodyMetricRecord) {
    setBodyEditId(row.id);
    setBodyDate(row.date);
    setWeight(row.weightKg);
    setBodyFat(row.bodyFatPct);
    setWaist(row.waistCm ?? "");
    setRestingHr(row.restingHr ?? "");
    setMessage("Body entry loaded in form for editing.");
  }

  return (
    <section className="space-y-6">
      <div className="section-head">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-brand-700">Journal</p>
          <h2 className="mt-2 text-3xl font-semibold text-brand-900">Daily Logging</h2>
          <p className="mt-1 text-sm text-slate-700">
            Add entries, review what you logged, and edit or delete mistakes from one screen.
          </p>
        </div>
      </div>

      {message && <p className="alert-success">{message}</p>}
      {error && <p className="alert-error">{error}</p>}

      <div className="card-hero">
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <p className="meta-label">Food Intake</p>
            <p className="metric-value">{Math.round(selectedRangeSummary.foodCalories)} kcal</p>
          </div>
          <div>
            <p className="meta-label">Exercise Burn</p>
            <p className="metric-value">{Math.round(selectedRangeSummary.burnCalories)} kcal</p>
          </div>
          <div>
            <p className="meta-label">Latest Weight</p>
            <p className="metric-value">
              {selectedRangeSummary.latestWeight != null ? `${selectedRangeSummary.latestWeight.toFixed(1)} kg` : "-"}
            </p>
          </div>
          <div>
            <p className="meta-label">Entries</p>
            <p className="metric-value">
              {feedCounts.food + feedCounts.exercise + feedCounts.sleep + feedCounts.body}
            </p>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1.3fr_1fr]">
        <form className="card space-y-4" onSubmit={submitFood}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-brand-900">Food Log</h3>
            {foodEditId && (
              <button type="button" className="btn-secondary" onClick={resetFoodForm}>
                Cancel Edit
              </button>
            )}
          </div>

          <label className="block text-sm">
            Date & Time
            <input
              className="field"
              type="datetime-local"
              value={foodDateTime}
              onChange={(event) => setFoodDateTime(event.target.value)}
              required
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Meal Type
              <select className="field" value={mealType} onChange={(event) => setMealType(event.target.value as MealType)}>
                {mealOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Item Name
              <input
                className="field"
                value={itemName}
                onChange={(event) => setItemName(event.target.value)}
                placeholder="Chicken breast, oats, lasagna"
                required
              />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="block text-sm">
              Quantity
              <input
                className="field"
                type="number"
                min={0.01}
                step="0.01"
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                required
              />
            </label>
            <label className="block text-sm">
              Unit
              <input className="field" value={unit} onChange={(event) => setUnit(event.target.value)} required />
            </label>
            <label className="block text-sm">
              Grams
              <input
                className="field"
                type="number"
                min={0}
                step="0.1"
                value={grams}
                onChange={(event) => setGrams(Number(event.target.value))}
              />
            </label>
          </div>

          <div className="rounded-xl border border-brand-200 bg-brand-50/70 p-3">
            <p className="text-sm font-semibold text-brand-900">Nutrition Autofill</p>
            <div className="mt-2 flex gap-2">
              <input
                className="field mt-0"
                value={nutritionQuery}
                onChange={(event) => setNutritionQuery(event.target.value)}
                placeholder="Search USDA/OpenFoodFacts"
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => void searchNutrition()}
                disabled={nutritionQuery.trim().length < 2}
              >
                Search
              </button>
            </div>

            {nutritionOptions.length > 0 && (
              <ul className="mt-3 max-h-48 space-y-2 overflow-auto">
                {nutritionOptions.map((option) => (
                  <li key={`${option.source}-${option.sourceRef}`}>
                    <button
                      type="button"
                      className={`w-full rounded-lg border p-2 text-left text-xs transition ${
                        selectedNutrition?.sourceRef === option.sourceRef
                          ? "border-brand-500 bg-brand-100"
                          : "border-brand-200 bg-white"
                      }`}
                      onClick={() => {
                        setSelectedNutrition(option);
                        setItemName(option.name);
                        setFoodSource(option.source);
                        setFoodSourceRef(option.sourceRef);
                        setCalories("");
                        setProtein("");
                        setCarbs("");
                        setFat("");
                        setFiber("");
                      }}
                    >
                      <p className="font-medium">{option.name}</p>
                      <p className="text-slate-600">
                        {option.source} • {Math.round(option.caloriesPer100g)} kcal / 100g
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {foodPreview && (
              <p className="mt-2 text-xs text-slate-700">
                Preview for {grams}g: {foodPreview.calories} kcal, P {foodPreview.protein}g, C {foodPreview.carbs}g,
                F {foodPreview.fat}g
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <label className="block text-sm">
              Calories
              <input
                className="field"
                type="number"
                step="0.1"
                value={calories}
                onChange={(event) => setCalories(event.target.value === "" ? "" : Number(event.target.value))}
              />
            </label>
            <label className="block text-sm">
              Protein
              <input
                className="field"
                type="number"
                step="0.1"
                value={protein}
                onChange={(event) => setProtein(event.target.value === "" ? "" : Number(event.target.value))}
              />
            </label>
            <label className="block text-sm">
              Carbs
              <input
                className="field"
                type="number"
                step="0.1"
                value={carbs}
                onChange={(event) => setCarbs(event.target.value === "" ? "" : Number(event.target.value))}
              />
            </label>
            <label className="block text-sm">
              Fat
              <input
                className="field"
                type="number"
                step="0.1"
                value={fat}
                onChange={(event) => setFat(event.target.value === "" ? "" : Number(event.target.value))}
              />
            </label>
            <label className="block text-sm">
              Fiber
              <input
                className="field"
                type="number"
                step="0.1"
                value={fiber}
                onChange={(event) => setFiber(event.target.value === "" ? "" : Number(event.target.value))}
              />
            </label>
          </div>

          <button className="btn" type="submit">
            {foodEditId ? "Update Food Entry" : "Save Food Entry"}
          </button>
        </form>

        <div className="space-y-6">
          <form className="card space-y-3" onSubmit={submitExercise}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-brand-900">Exercise Log</h3>
              {exerciseEditId && (
                <button type="button" className="btn-secondary" onClick={resetExerciseForm}>
                  Cancel Edit
                </button>
              )}
            </div>

            <label className="block text-sm">
              Date & Time
              <input
                className="field"
                type="datetime-local"
                value={exerciseDateTime}
                onChange={(event) => setExerciseDateTime(event.target.value)}
                required
              />
            </label>
            <label className="block text-sm">
              Activity
              <input
                className="field"
                value={activityName}
                onChange={(event) => setActivityName(event.target.value)}
                required
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                Duration (min)
                <input
                  className="field"
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(event) => setDuration(Number(event.target.value))}
                  required
                />
              </label>
              <label className="block text-sm">
                Intensity
                <select
                  className="field"
                  value={intensity}
                  onChange={(event) => setIntensity(event.target.value as Intensity)}
                >
                  {intensityOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block text-sm">
              Calories Burned (optional override)
              <input
                className="field"
                type="number"
                step="0.1"
                value={exerciseCalories}
                onChange={(event) =>
                  setExerciseCalories(event.target.value === "" ? "" : Number(event.target.value))
                }
              />
            </label>
            <button className="btn" type="submit">
              {exerciseEditId ? "Update Exercise Entry" : "Save Exercise Entry"}
            </button>
          </form>

          <form className="card space-y-3" onSubmit={submitSleep}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-brand-900">Sleep Log</h3>
              {sleepEditId && (
                <button type="button" className="btn-secondary" onClick={resetSleepForm}>
                  Cancel Edit
                </button>
              )}
            </div>

            <label className="block text-sm">
              Date
              <input
                className="field"
                type="date"
                value={sleepDate}
                onChange={(event) => setSleepDate(event.target.value)}
                required
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                Hours
                <input
                  className="field"
                  type="number"
                  min={0}
                  max={24}
                  step="0.1"
                  value={sleepHours}
                  onChange={(event) => setSleepHours(Number(event.target.value))}
                  required
                />
              </label>
              <label className="block text-sm">
                Score (1-10)
                <input
                  className="field"
                  type="number"
                  min={1}
                  max={10}
                  step="0.1"
                  value={sleepScore}
                  onChange={(event) => setSleepScore(Number(event.target.value))}
                  required
                />
              </label>
            </div>
            <label className="block text-sm">
              Sleep Notes
              <textarea
                className="field min-h-20"
                value={sleepText}
                onChange={(event) => setSleepText(event.target.value)}
                required
              />
            </label>
            <button className="btn" type="submit">
              {sleepEditId ? "Update Sleep Entry" : "Save Sleep Entry"}
            </button>
          </form>

          <form className="card space-y-3" onSubmit={submitBody}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-brand-900">Body Metrics</h3>
              {bodyEditId && (
                <button type="button" className="btn-secondary" onClick={resetBodyForm}>
                  Cancel Edit
                </button>
              )}
            </div>

            <label className="block text-sm">
              Date
              <input
                className="field"
                type="date"
                value={bodyDate}
                onChange={(event) => setBodyDate(event.target.value)}
                required
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                Weight (kg)
                <input
                  className="field"
                  type="number"
                  min={1}
                  step="0.1"
                  value={weight}
                  onChange={(event) => setWeight(Number(event.target.value))}
                  required
                />
              </label>
              <label className="block text-sm">
                Body Fat (%)
                <input
                  className="field"
                  type="number"
                  min={1}
                  max={80}
                  step="0.1"
                  value={bodyFat}
                  onChange={(event) => setBodyFat(Number(event.target.value))}
                  required
                />
              </label>
              <label className="block text-sm">
                Waist (cm)
                <input
                  className="field"
                  type="number"
                  step="0.1"
                  value={waist}
                  onChange={(event) => setWaist(event.target.value === "" ? "" : Number(event.target.value))}
                />
              </label>
              <label className="block text-sm">
                Resting HR
                <input
                  className="field"
                  type="number"
                  step="1"
                  value={restingHr}
                  onChange={(event) =>
                    setRestingHr(event.target.value === "" ? "" : Number(event.target.value))
                  }
                />
              </label>
            </div>
            <button className="btn" type="submit">
              {bodyEditId ? "Update Body Entry" : "Save Body Entry"}
            </button>
          </form>
        </div>
      </div>

      <section className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-brand-900">Logged Entries</h3>
            <p className="text-sm text-slate-700">
              {windowMode === "day"
                ? `Showing entries for ${selectedDate}`
                : `Showing entries for 7 days ending ${selectedDate}`}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <label className="text-sm">
              Focus Date
              <input
                className="field mt-1"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </label>
            <div className="flex gap-2 pb-1">
              <button
                type="button"
                onClick={() => setWindowMode("day")}
                className={windowMode === "day" ? "btn" : "btn-secondary"}
              >
                Selected Day
              </button>
              <button
                type="button"
                onClick={() => setWindowMode("week")}
                className={windowMode === "week" ? "btn" : "btn-secondary"}
              >
                Last 7 Days
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {feedTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveFeedTab(tab)}
              className={activeFeedTab === tab ? "btn" : "btn-secondary"}
            >
              {tab === "all"
                ? "All"
                : `${tab[0].toUpperCase()}${tab.slice(1)} (${feedCounts[tab as Exclude<FeedTab, "all">]})`}
            </button>
          ))}
          <button type="button" className="btn-secondary" onClick={() => void loadLogs()}>
            Refresh
          </button>
        </div>

        {logsLoading && <p className="text-sm text-slate-700">Loading entries...</p>}

        {!logsLoading &&
          feedCounts.food + feedCounts.exercise + feedCounts.sleep + feedCounts.body === 0 && (
            <p className="rounded-lg border border-brand-200 bg-brand-50/70 p-4 text-sm text-slate-700">
              No entries in this range yet. Add your first log above.
            </p>
          )}

        <div className="grid gap-4 lg:grid-cols-2">
          {(activeFeedTab === "all" || activeFeedTab === "food") && foodLogs.length > 0 && (
            <article className="rounded-xl border border-brand-200 bg-white/95 p-3 shadow-sm">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-brand-800">Food</h4>
              <ul className="mt-2 space-y-2">
                {foodLogs.map((row) => (
                  <li key={row.id} className="rounded-lg border border-brand-100 bg-brand-50/60 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {row.itemName} ({row.mealType})
                        </p>
                        <p className="text-xs text-slate-600">
                          {new Date(row.dateTime).toLocaleString()} • {row.quantity} {row.unit}
                        </p>
                        <p className="text-xs text-slate-600">
                          {Math.round(row.caloriesKcal ?? 0)} kcal • P {row.proteinG ?? 0}g • C {row.carbsG ?? 0}g • F {row.fatG ?? 0}g
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className="btn-secondary" onClick={() => beginFoodEdit(row)}>
                          Edit
                        </button>
                        <button type="button" className="btn-danger" onClick={() => void removeEntry("food", row.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          )}

          {(activeFeedTab === "all" || activeFeedTab === "exercise") && exerciseLogs.length > 0 && (
            <article className="rounded-xl border border-brand-200 bg-white/95 p-3 shadow-sm">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-brand-800">Exercise</h4>
              <ul className="mt-2 space-y-2">
                {exerciseLogs.map((row) => (
                  <li key={row.id} className="rounded-lg border border-brand-100 bg-brand-50/60 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{row.activityName}</p>
                        <p className="text-xs text-slate-600">
                          {new Date(row.dateTime).toLocaleString()} • {row.durationMin} min • {row.intensity}
                        </p>
                        <p className="text-xs text-slate-600">
                          Burn: {Math.round(row.caloriesBurnedKcal ?? 0)} kcal • MET {row.metValue?.toFixed(1) ?? "-"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className="btn-secondary" onClick={() => beginExerciseEdit(row)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => void removeEntry("exercise", row.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          )}

          {(activeFeedTab === "all" || activeFeedTab === "sleep") && sleepLogs.length > 0 && (
            <article className="rounded-xl border border-brand-200 bg-white/95 p-3 shadow-sm">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-brand-800">Sleep</h4>
              <ul className="mt-2 space-y-2">
                {sleepLogs.map((row) => (
                  <li key={row.id} className="rounded-lg border border-brand-100 bg-brand-50/60 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{row.date}</p>
                        <p className="text-xs text-slate-600">
                          {row.sleepHours.toFixed(1)}h • Score {row.sleepScore.toFixed(1)}/10
                        </p>
                        <p className="text-xs text-slate-600">{row.sleepQualityText}</p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className="btn-secondary" onClick={() => beginSleepEdit(row)}>
                          Edit
                        </button>
                        <button type="button" className="btn-danger" onClick={() => void removeEntry("sleep", row.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          )}

          {(activeFeedTab === "all" || activeFeedTab === "body") && bodyLogs.length > 0 && (
            <article className="rounded-xl border border-brand-200 bg-white/95 p-3 shadow-sm">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-brand-800">Body Metrics</h4>
              <ul className="mt-2 space-y-2">
                {bodyLogs.map((row) => (
                  <li key={row.id} className="rounded-lg border border-brand-100 bg-brand-50/60 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{row.date}</p>
                        <p className="text-xs text-slate-600">
                          Weight {row.weightKg.toFixed(1)} kg • Body fat {row.bodyFatPct.toFixed(1)}%
                        </p>
                        <p className="text-xs text-slate-600">
                          Waist {row.waistCm?.toFixed(1) ?? "-"} cm • Resting HR {row.restingHr?.toFixed(0) ?? "-"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className="btn-secondary" onClick={() => beginBodyEdit(row)}>
                          Edit
                        </button>
                        <button type="button" className="btn-danger" onClick={() => void removeEntry("body", row.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          )}
        </div>
      </section>
    </section>
  );
}
