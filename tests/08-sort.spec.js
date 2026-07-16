import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://127.0.0.1:5500/CODE/index.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("Sort A-Z orders tasks alphabetically", async ({ page }) => {
  await page.fill("#taskInput", "banana task");
  await page.click("#addTaskBtn");
  await page.fill("#taskInput", "Apple task");
  await page.click("#addTaskBtn");
  await page.fill("#taskInput", "cherry task");
  await page.click("#addTaskBtn");

  await page.click('.sort-btn[data-sort="text"]');

  await expect(page.locator(".task-text").first()).toHaveText("Apple task");
  await expect(page.locator(".task-text").last()).toHaveText("cherry task");
});

test("Sort by priority puts High first", async ({ page }) => {
  await page.fill("#taskInput", "low one");
  await page.selectOption("#priorityInput", "low");
  await page.click("#addTaskBtn");
  await page.fill("#taskInput", "high one");
  await page.selectOption("#priorityInput", "high");
  await page.click("#addTaskBtn");
  await page.fill("#taskInput", "medium one");
  await page.selectOption("#priorityInput", "medium");
  await page.click("#addTaskBtn");

  await page.click('.sort-btn[data-sort="priority"]');

  await expect(page.locator(".task-text").first()).toHaveText("high one");
  await expect(page.locator(".task-text").last()).toHaveText("low one");
});

test("Default sort orders by earliest due date first", async ({ page }) => {
  await page.fill("#taskInput", "due later");
  await page.fill("#dueDateInput", "2026-12-31");
  await page.click("#addTaskBtn");
  await page.fill("#taskInput", "due sooner");
  await page.fill("#dueDateInput", "2026-08-01");
  await page.click("#addTaskBtn");

  await expect(page.locator(".task-text").first()).toHaveText("due sooner");
});
