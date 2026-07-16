import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://127.0.0.1:5500/CODE/index.html");

  await page.evaluate(() => localStorage.clear());

  await page.reload();

  await page.fill("#taskInput", "Complete Me");

  await page.click("#addTaskBtn");
});

test("Mark task completed", async ({ page }) => {
  await page.check(".task-checkbox");

  await expect(page.locator(".task-item")).toHaveClass(/is-completed/);
});

test("Undo completed task", async ({ page }) => {
  await page.check(".task-checkbox");

  await page.uncheck(".task-checkbox");

  await expect(page.locator(".task-item")).not.toHaveClass(/is-completed/);
});
