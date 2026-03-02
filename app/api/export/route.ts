import fs from "node:fs/promises";
import path from "node:path";
import { and, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bodyMetrics,
  exerciseLogs,
  exportsTable,
  foodLogs,
  goals,
  reportSnapshots,
  sleepLogs,
  userProfile
} from "@/lib/db/schema";
import { jsonOk, parseBody } from "@/lib/http";
import { createId } from "@/lib/id";
import { nowIso } from "@/lib/time";
import { exportSchema } from "@/lib/validators";

export const runtime = "nodejs";

function toCsvSection(name: string, rows: Record<string, unknown>[]): string {
  if (rows.length === 0) {
    return `# ${name}\n(no rows)\n`;
  }

  const headers = Object.keys(rows[0]);
  const lines = [
    `# ${name}`,
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (value == null) {
            return "";
          }
          const text = String(value).replaceAll('"', '""');
          return `"${text}"`;
        })
        .join(",")
    ),
    ""
  ];
  return lines.join("\n");
}

export async function POST(request: Request) {
  const parsed = await parseBody(request, exportSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const { format, range_start, range_end } = parsed.data;
  const now = nowIso();

  const [profileRows, goalRows, foodRows, exerciseRows, sleepRows, bodyRows, reportRows] =
    await Promise.all([
      db.select().from(userProfile),
      db.select().from(goals),
      range_start && range_end
        ? db
            .select()
            .from(foodLogs)
            .where(and(gte(foodLogs.dateTime, `${range_start}T00:00:00.000Z`), lte(foodLogs.dateTime, `${range_end}T23:59:59.999Z`)))
        : db.select().from(foodLogs),
      range_start && range_end
        ? db
            .select()
            .from(exerciseLogs)
            .where(and(gte(exerciseLogs.dateTime, `${range_start}T00:00:00.000Z`), lte(exerciseLogs.dateTime, `${range_end}T23:59:59.999Z`)))
        : db.select().from(exerciseLogs),
      range_start && range_end
        ? db.select().from(sleepLogs).where(and(gte(sleepLogs.date, range_start), lte(sleepLogs.date, range_end)))
        : db.select().from(sleepLogs),
      range_start && range_end
        ? db
            .select()
            .from(bodyMetrics)
            .where(and(gte(bodyMetrics.date, range_start), lte(bodyMetrics.date, range_end)))
        : db.select().from(bodyMetrics),
      range_start && range_end
        ? db
            .select()
            .from(reportSnapshots)
            .where(and(gte(reportSnapshots.periodStart, range_start), lte(reportSnapshots.periodEnd, range_end)))
        : db.select().from(reportSnapshots)
    ]);

  const payload = {
    exported_at: now,
    range_start: range_start ?? null,
    range_end: range_end ?? null,
    user_profile: profileRows,
    goals: goalRows,
    food_logs: foodRows,
    exercise_logs: exerciseRows,
    sleep_logs: sleepRows,
    body_metrics: bodyRows,
    report_snapshots: reportRows
  };

  const fileId = createId();
  const extension = format === "json" ? "json" : "csv";
  const fileName = `export-${fileId}.${extension}`;
  const outputDir =
    process.env.VERCEL === "1" ? "/tmp/body-tracker-exports" : path.join(process.cwd(), "exports");
  const outputPath = path.join(outputDir, fileName);
  await fs.mkdir(outputDir, { recursive: true });

  if (format === "json") {
    await fs.writeFile(outputPath, JSON.stringify(payload, null, 2), "utf-8");
  } else {
    const csv = [
      toCsvSection("user_profile", profileRows as Record<string, unknown>[]),
      toCsvSection("goals", goalRows as Record<string, unknown>[]),
      toCsvSection("food_logs", foodRows as Record<string, unknown>[]),
      toCsvSection("exercise_logs", exerciseRows as Record<string, unknown>[]),
      toCsvSection("sleep_logs", sleepRows as Record<string, unknown>[]),
      toCsvSection("body_metrics", bodyRows as Record<string, unknown>[]),
      toCsvSection("report_snapshots", reportRows as Record<string, unknown>[])
    ].join("\n");
    await fs.writeFile(outputPath, csv, "utf-8");
  }

  await db.insert(exportsTable).values({
    id: fileId,
    exportedAt: now,
    exportType: format,
    rangeStart: range_start,
    rangeEnd: range_end,
    filePath: outputPath
  });

  return jsonOk(
    {
      id: fileId,
      exported_at: now,
      format,
      file_path: outputPath
    },
    201
  );
}
