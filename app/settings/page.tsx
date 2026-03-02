"use client";

import { ChangeEvent, useState } from "react";

export default function SettingsPage() {
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [importText, setImportText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: exportFormat,
          range_start: rangeStart || undefined,
          range_end: rangeEnd || undefined
        })
      });
      const json = (await response.json()) as { error?: string; file_path?: string };
      if (!response.ok) {
        throw new Error(json.error ?? `Export failed (${response.status})`);
      }
      setMessage(`Export saved at ${json.file_path}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  }

  async function handleImport() {
    setMessage(null);
    setError(null);
    try {
      if (!importText.trim()) {
        throw new Error("Paste a valid export JSON payload first.");
      }

      const parsed = JSON.parse(importText) as Record<string, unknown>;
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: importMode,
          payload: parsed
        })
      });
      const json = (await response.json()) as { error?: string; inserted?: Record<string, number> };
      if (!response.ok) {
        throw new Error(json.error ?? `Import failed (${response.status})`);
      }
      setMessage(`Import complete. Inserted rows: ${JSON.stringify(json.inserted)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImportText(String(reader.result ?? ""));
    };
    reader.readAsText(file);
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-brand-900">Settings</h2>
        <p className="text-sm text-slate-700">Data portability, deployment modes, and free API configuration.</p>
      </div>

      {message && <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</p>}
      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="card space-y-3">
        <h3 className="text-lg font-semibold">Run Locally (Laptop + iPhone)</h3>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
          <li>Start the app with `npm run dev:lan`.</li>
          <li>Find your laptop IP, e.g. `192.168.x.x`.</li>
          <li>Open `http://YOUR_IP:3000` on your iPhone on the same Wi-Fi.</li>
          <li>Use “Add to Home Screen” in Safari to install as PWA.</li>
        </ol>
      </div>

      <div className="card space-y-3">
        <h3 className="text-lg font-semibold">Run on Vercel (Internet Access)</h3>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
          <li>Push this repo to GitHub.</li>
          <li>Import the repo in Vercel and deploy.</li>
          <li>Add environment variables in Vercel: `USDA_API_KEY` (optional), `DB_FILE_PATH` (optional).</li>
          <li>After deploy, open your Vercel domain from any device.</li>
        </ol>
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Current storage is SQLite. On Vercel serverless runtime, file storage is temporary (`/tmp`), so logs can
          reset. Use regular exports as backup.
        </p>
      </div>

      <div className="card space-y-3">
        <h3 className="text-lg font-semibold">Nutrition API (Free)</h3>
        <p className="text-sm text-slate-700">
          To enable USDA lookup, add `USDA_API_KEY` in `.env.local`. OpenFoodFacts fallback works without key.
        </p>
      </div>

      <div className="card space-y-3">
        <h3 className="text-lg font-semibold">Export Data</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            Format
            <select
              className="field"
              value={exportFormat}
              onChange={(event) => setExportFormat(event.target.value as "json" | "csv")}
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </label>
          <label className="text-sm">
            Range Start (optional)
            <input
              className="field"
              type="date"
              value={rangeStart}
              onChange={(event) => setRangeStart(event.target.value)}
            />
          </label>
          <label className="text-sm">
            Range End (optional)
            <input
              className="field"
              type="date"
              value={rangeEnd}
              onChange={(event) => setRangeEnd(event.target.value)}
            />
          </label>
        </div>
        <button className="btn" onClick={handleExport}>
          Create Export
        </button>
      </div>

      <div className="card space-y-3">
        <h3 className="text-lg font-semibold">Import Data</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Import Mode
            <select
              className="field"
              value={importMode}
              onChange={(event) => setImportMode(event.target.value as "append" | "replace")}
            >
              <option value="append">Append</option>
              <option value="replace">Replace Existing</option>
            </select>
          </label>
          <label className="text-sm">
            Load JSON file
            <input className="field" type="file" accept=".json,application/json" onChange={onFileChange} />
          </label>
        </div>
        <label className="block text-sm">
          JSON payload
          <textarea
            className="field min-h-52 font-mono text-xs"
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            placeholder="Paste export JSON here..."
          />
        </label>
        <button className="btn" onClick={handleImport}>
          Import Data
        </button>
      </div>
    </section>
  );
}
