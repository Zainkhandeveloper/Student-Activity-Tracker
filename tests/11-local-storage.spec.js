import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://127.0.0.1:5500/CODE/index.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("Task persists after page reload", async ({ page }) => {
  await page.fill("#taskInput", "Persist me");
  await page.click("#addTaskBtn");
  await page.reload();
  await expect(page.locator(".task-item")).toContainText("Persist me");
  await expect(page.locator("#totalTasks")).toHaveText("1");
});

test("Task data is actually written to localStorage", async ({ page }) => {
  await page.fill("#taskInput", "Check storage");
  await page.click("#addTaskBtn");
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("studentTasks")),
  );
  expect(saved.length).toBe(1);
  expect(saved[0].text).toBe("Check storage");
});

test("Clearing localStorage directly and reloading shows an empty list", async ({
  page,
}) => {
  await page.fill("#taskInput", "Temporary task");
  await page.click("#addTaskBtn");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator(".task-item")).toHaveCount(0);
  await expect(page.locator("#totalTasks")).toHaveText("0");
});
