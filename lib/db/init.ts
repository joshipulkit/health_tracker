import type Database from "better-sqlite3";

export function ensureSchema(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      dob TEXT,
      sex TEXT,
      height_cm REAL,
      baseline_activity_level TEXT,
      preferred_units TEXT NOT NULL DEFAULT 'metric',
      current_weight_kg REAL,
      current_body_fat_pct REAL,
      waist_cm REAL,
      resting_hr REAL,
      goal_pace_kg_per_week REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      start_date TEXT NOT NULL,
      target_date TEXT NOT NULL,
      target_weight_kg REAL NOT NULL,
      target_body_fat_pct REAL,
      target_pace_kg_per_week REAL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS food_logs (
      id TEXT PRIMARY KEY,
      date_time TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      item_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      grams REAL,
      calories_kcal REAL,
      protein_g REAL,
      carbs_g REAL,
      fat_g REAL,
      fiber_g REAL,
      source TEXT NOT NULL,
      source_ref TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exercise_logs (
      id TEXT PRIMARY KEY,
      date_time TEXT NOT NULL,
      activity_name TEXT NOT NULL,
      duration_min REAL NOT NULL,
      intensity TEXT NOT NULL,
      met_value REAL,
      calories_burned_kcal REAL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sleep_logs (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      sleep_hours REAL NOT NULL,
      sleep_score_1_10 REAL NOT NULL,
      sleep_quality_text TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS body_metrics (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      weight_kg REAL NOT NULL,
      body_fat_pct REAL NOT NULL,
      waist_cm REAL,
      resting_hr REAL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS report_snapshots (
      id TEXT PRIMARY KEY,
      period_type TEXT NOT NULL,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      summary_text TEXT NOT NULL,
      actions_json TEXT NOT NULL,
      patterns_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exports (
      id TEXT PRIMARY KEY,
      exported_at TEXT NOT NULL,
      export_type TEXT NOT NULL,
      range_start TEXT,
      range_end TEXT,
      file_path TEXT NOT NULL
    );
  `);
}
