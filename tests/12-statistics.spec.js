import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://127.0.0.1:5500/CODE/index.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("Statistics show correct total, completed, and pending counts", async ({
  page,
}) => {
  await page.fill("#taskInput", "One");
  await page.click("#addTaskBtn");
  await page.fill("#taskInput", "Two");
  await page.click("#addTaskBtn");
  await page.fill("#taskInput", "Three");
  await page.click("#addTaskBtn");

  await page.locator(".task-checkbox").first().check();

  await expect(page.locator("#totalTasks")).toHaveText("3");
  await expect(page.locator("#completedTasks")).toHaveText("1");
  await expect(page.locator("#pendingTasks")).toHaveText("2");
});

test("Completion percentage updates correctly", async ({ page }) => {
  await page.fill("#taskInput", "One");
  await page.click("#addTaskBtn");
  await page.fill("#taskInput", "Two");
  await page.click("#addTaskBtn");

  await page.locator(".task-checkbox").first().check();

  await expect(page.locator("#progressPercentage")).toHaveText("50");
});

test("Zero tasks shows 0% completion", async ({ page }) => {
  await expect(page.locator("#progressPercentage")).toHaveText("0");
  await expect(page.locator("#totalTasks")).toHaveText("0");
});
