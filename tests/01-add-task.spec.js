import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://127.0.0.1:5500/CODE/index.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("User can add a new task", async ({ page }) => {
  await page.fill("#taskInput", "Finish SCD Assignment");

  await page.click("#addTaskBtn");

  await expect(page.locator(".task-item")).toContainText(
    "Finish SCD Assignment",
  );

  await expect(page.locator("#totalTasks")).toHaveText("1");
});

test("User can add task with high priority", async ({ page }) => {
  await page.fill("#taskInput", "Prepare Presentation");

  await page.selectOption("#priorityInput", "high");

  await page.click("#addTaskBtn");

  await expect(page.locator(".task-priority-badge")).toContainText("High");
});

test("User can add task with due date", async ({ page }) => {
  await page.fill("#taskInput", "Database Assignment");

  await page.fill("#dueDateInput", "2026-08-01");

  await page.click("#addTaskBtn");

  await expect(page.locator(".task-due-date")).not.toContainText("No due date");
});
