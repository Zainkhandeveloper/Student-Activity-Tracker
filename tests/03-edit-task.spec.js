import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://127.0.0.1:5500/CODE/index.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.fill("#taskInput", "Old Task");
  await page.click("#addTaskBtn");
});

test("User can edit task", async ({ page }) => {
  await page.click(".edit-btn");

  await page.fill(".task-edit-input", "New Task");

  await page.click(".save-btn");

  await expect(page.locator(".task-item")).toContainText("New Task");
});

test("User can cancel editing", async ({ page }) => {
  await page.click(".edit-btn");

  await page.fill(".task-edit-input", "Changed");

  await page.click(".cancel-btn");

  await expect(page.locator(".task-item")).toContainText("Old Task");
});
