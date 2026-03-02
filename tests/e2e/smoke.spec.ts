import { test, expect } from "@playwright/test";

test("home page renders core navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Log" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Insights" })).toBeVisible();
});
