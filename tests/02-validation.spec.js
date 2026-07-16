import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://127.0.0.1:5500/CODE/index.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("Cannot add empty task", async ({ page }) => {
  await page.click("#addTaskBtn");

  await expect(page.locator("#message")).toContainText("Task cannot be empty");
});

test("Cannot add duplicate task", async ({ page }) => {
  await page.fill("#taskInput", "Assignment");

  await page.click("#addTaskBtn");

  await page.fill("#taskInput", "Assignment");

  await page.click("#addTaskBtn");

  await expect(page.locator("#message")).toContainText("already exists");
});
