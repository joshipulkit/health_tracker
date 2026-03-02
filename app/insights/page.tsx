"use client";

import { useEffect, useState } from "react";
import type { ReportSnapshotRecord } from "@/lib/local-types";
import { generateReportLocal, listReports } from "@/lib/local-store";

export default function InsightsPage() {
  const [period, setPeriod] = useState<"daily" | "weekly">("daily");
  const [history, setHistory] = useState<ReportSnapshotRecord[]>([]);
  const [latest, setLatest] = useState<ReportSnapshotRecord | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadHistory() {
    const rows = await listReports();
    setHistory(rows);
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  async function generateReport() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const report = await generateReportLocal(period);
      setLatest(report);
      setMessage(`${period[0].toUpperCase()}${period.slice(1)} report generated locally.`);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="section-head">
        <h2 className="text-3xl font-semibold text-brand-900">Insights</h2>
        <p className="text-sm text-slate-700">
          Rule-based analysis runs on this device and stores report history locally.
        </p>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="field mt-0 max-w-44"
            value={period}
            onChange={(event) => setPeriod(event.target.value as "daily" | "weekly")}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
          <button className="btn" onClick={generateReport} disabled={loading}>
            {loading ? "Generating..." : `Generate ${period} report`}
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-green-700">{message}</p>}
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      </div>

      {latest && (
        <article className="card space-y-3">
          <h3 className="text-lg font-semibold">Latest Report</h3>
          <p className="text-sm">{latest.summaryText}</p>
          <div>
            <h4 className="text-sm font-semibold">Patterns</h4>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
              {latest.patterns.map((pattern, idx) => (
                <li key={`${pattern}-${idx}`}>{pattern}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Action Checklist</h4>
            <ul className="mt-1 list-decimal space-y-1 pl-5 text-sm">
              {latest.actions.map((action, idx) => (
                <li key={`${action}-${idx}`}>{action}</li>
              ))}
            </ul>
          </div>
        </article>
      )}

      <section className="card">
        <h3 className="text-lg font-semibold">Report History</h3>
        <p className="mt-1 text-xs text-slate-600">Stored only on this device.</p>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No reports generated yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {history.map((report) => (
              <article key={report.id} className="rounded-md border border-brand-200 bg-brand-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold capitalize">{report.periodType} report</p>
                  <p className="text-xs text-slate-600">{new Date(report.createdAt).toLocaleString()}</p>
                </div>
                <p className="mt-1 text-sm">{report.summaryText}</p>
                <p className="mt-1 text-xs text-slate-600">
                  Window: {report.periodStart} → {report.periodEnd}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
