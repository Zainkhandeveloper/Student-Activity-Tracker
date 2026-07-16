import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://127.0.0.1:5500/CODE/index.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.fill("#taskInput", "Task A");
  await page.click("#addTaskBtn");
  await page.fill("#taskInput", "Task B");
  await page.click("#addTaskBtn");
});

test("User can clear all tasks", async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
  await page.click("#clearAllBtn");
  await expect(page.locator(".task-item")).toHaveCount(0);
});

test("Cancelling clear-all confirmation keeps the tasks", async ({ page }) => {
  page.on("dialog", (dialog) => dialog.dismiss());
  await page.click("#clearAllBtn");
  await expect(page.locator(".task-item")).toHaveCount(2);
});
