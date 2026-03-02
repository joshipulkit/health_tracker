import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const testDbPath = path.join(process.cwd(), "data", "test-api.db");

async function loadRoute() {
  process.env.DB_FILE_PATH = testDbPath;
  vi.resetModules();
  return import("@/app/api/logs/food/route");
}

afterEach(() => {
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
  const wal = `${testDbPath}-wal`;
  const shm = `${testDbPath}-shm`;
  if (fs.existsSync(wal)) fs.unlinkSync(wal);
  if (fs.existsSync(shm)) fs.unlinkSync(shm);
});

describe("POST /api/logs/food", () => {
  it("stores a food log and returns id", async () => {
    const route = await loadRoute();
    const request = new Request("http://localhost/api/logs/food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date_time: "2026-03-02T10:00:00.000Z",
        meal_type: "lunch",
        item_name: "Apple",
        quantity: 1,
        unit: "piece",
        grams: 150,
        calories_kcal: 78,
        protein_g: 0.3,
        carbs_g: 21,
        fat_g: 0.2,
        fiber_g: 4,
        source: "manual"
      })
    });

    const response = await route.POST(request);
    expect(response.status).toBe(201);
    const json = (await response.json()) as { id: string };
    expect(json.id).toBeTruthy();
  });

  it("updates and deletes a food log", async () => {
    const route = await loadRoute();
    const createRequest = new Request("http://localhost/api/logs/food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date_time: "2026-03-02T10:00:00.000Z",
        meal_type: "lunch",
        item_name: "Rice",
        quantity: 1,
        unit: "bowl",
        source: "manual"
      })
    });
    const createResponse = await route.POST(createRequest);
    const created = (await createResponse.json()) as { id: string };

    const updateRequest = new Request("http://localhost/api/logs/food", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: created.id,
        date_time: "2026-03-02T10:30:00.000Z",
        meal_type: "dinner",
        item_name: "Rice bowl",
        quantity: 1.2,
        unit: "bowl",
        calories_kcal: 440,
        source: "manual"
      })
    });
    const updateResponse = await route.PUT(updateRequest);
    expect(updateResponse.status).toBe(200);

    const deleteRequest = new Request("http://localhost/api/logs/food", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: created.id
      })
    });
    const deleteResponse = await route.DELETE(deleteRequest);
    expect(deleteResponse.status).toBe(200);
  });
});
