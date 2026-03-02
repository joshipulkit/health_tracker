"use client";

import { ChangeEvent, useState } from "react";
import { exportLocalData, exportLocalDataCsv, importLocalData } from "@/lib/local-store";

function downloadTextFile(filename: string, text: string, mimeType: string) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

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
      const nowLabel = new Date().toISOString().replaceAll(":", "-").slice(0, 19);
      if (exportFormat === "json") {
        const payload = await exportLocalData({
          rangeStart: rangeStart || undefined,
          rangeEnd: rangeEnd || undefined
        });
        const text = JSON.stringify(payload, null, 2);
        downloadTextFile(`health-tracker-export-${nowLabel}.json`, text, "application/json");
        setMessage("JSON export downloaded from local device data.");
      } else {
        const csv = await exportLocalDataCsv({
          rangeStart: rangeStart || undefined,
          rangeEnd: rangeEnd || undefined
        });
        downloadTextFile(`health-tracker-export-${nowLabel}.csv`, csv, "text/csv");
        setMessage("CSV export downloaded from local device data.");
      }
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
      const parsed = JSON.parse(importText) as unknown;
      const inserted = await importLocalData(parsed, importMode);
      setMessage(`Import complete. Inserted rows: ${JSON.stringify(inserted)}`);
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
      <div className="section-head">
        <h2 className="text-3xl font-semibold text-brand-900">Settings</h2>
        <p className="text-sm text-slate-700">Data portability, deployment modes, and free API configuration.</p>
      </div>

      {message && <p className="alert-success">{message}</p>}
      {error && <p className="alert-error">{error}</p>}

      <div className="card space-y-3">
        <h3 className="text-lg font-semibold">Local-First Data Mode</h3>
        <p className="text-sm text-slate-700">
          All health data is saved in your browser's IndexedDB on this device only. Different devices keep separate
          copies unless you export/import manually.
        </p>
      </div>

      <div className="card space-y-3">
        <h3 className="text-lg font-semibold">Run Locally (Laptop + iPhone)</h3>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
          <li>Start the app with `npm run dev:lan`.</li>
          <li>Find your laptop IP, e.g. `192.168.x.x`.</li>
          <li>Open `http://YOUR_IP:3000` on your iPhone on the same Wi-Fi.</li>
          <li>Use Add to Home Screen in Safari to install as PWA.</li>
        </ol>
      </div>

      <div className="card space-y-3">
        <h3 className="text-lg font-semibold">Run on Vercel (Internet Access)</h3>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
          <li>Connect your GitHub repo in Vercel and deploy as Next.js.</li>
          <li>Add `USDA_API_KEY` in Vercel environment variables for nutrition lookup.</li>
          <li>Open your Vercel URL from any device.</li>
        </ol>
        <p className="rounded-lg border border-brand-200 bg-brand-50 p-3 text-xs text-slate-700">
          In local-first mode, each browser/device stores its own dataset. Use export/import to sync data manually
          between devices.
        </p>
      </div>

      <div className="card space-y-3">
        <h3 className="text-lg font-semibold">Nutrition API (Free)</h3>
        <p className="text-sm text-slate-700">
          USDA lookup uses your server-side `USDA_API_KEY`. OpenFoodFacts fallback works without key.
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
          Download Export
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
