import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://127.0.0.1:5500/CODE/index.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.fill("#taskInput", "Pending one");
  await page.click("#addTaskBtn");
  await page.fill("#taskInput", "Pending two");
  await page.click("#addTaskBtn");
  await page.fill("#taskInput", "Will complete");
  await page.click("#addTaskBtn");

  await page
    .locator(".task-item", { hasText: "Will complete" })
    .locator(".task-checkbox")
    .check();
});

test("Completed filter shows only completed tasks", async ({ page }) => {
  await page.click('.filter-btn[data-filter="completed"]');
  await expect(page.locator(".task-item")).toHaveCount(1);
  await expect(page.locator(".task-item")).toContainText(["Will complete"]);
});

test("Pending filter shows only pending tasks", async ({ page }) => {
  await page.click('.filter-btn[data-filter="pending"]');
  await expect(page.locator(".task-item")).toHaveCount(2);
});

test("All filter shows every task regardless of status", async ({ page }) => {
  await page.click('.filter-btn[data-filter="completed"]');
  await page.click('.filter-btn[data-filter="all"]');
  await expect(page.locator(".task-item")).toHaveCount(3);
});
