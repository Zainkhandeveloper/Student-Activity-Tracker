import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://127.0.0.1:5500/CODE/index.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.fill("#taskInput", "Write literature review");
  await page.click("#addTaskBtn");
  await page.fill("#taskInput", "Prepare lab equipment");
  await page.click("#addTaskBtn");
  await page.fill("#taskInput", "Review lab notes");
  await page.click("#addTaskBtn");
});

test("Search filters tasks by matching text", async ({ page }) => {
  await page.fill("#searchInput", "review");
  await expect(page.locator(".task-item")).toHaveCount(2);
  await expect(page.locator(".task-item")).toContainText(["Write literature review"]);
});

test("Search is case-insensitive", async ({ page }) => {
  await page.fill("#searchInput", "REVIEW");
  await expect(page.locator(".task-item")).toHaveCount(2);
});

test("Search with no matches shows empty state", async ({ page }) => {
  await page.fill("#searchInput", "nonexistent-xyz");
  await expect(page.locator(".task-item")).toHaveCount(0);
  await expect(page.locator("#taskList")).toContainText("No tasks found");
});

test("Clearing the search restores the full list", async ({ page }) => {
  await page.fill("#searchInput", "review");
  await page.fill("#searchInput", "");
  await expect(page.locator(".task-item")).toHaveCount(3);
});