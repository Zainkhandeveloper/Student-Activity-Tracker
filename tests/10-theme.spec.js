import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://127.0.0.1:5500/CODE/index.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("User can toggle dark/light mode", async ({ page }) => {
  const before = await page.locator("html").getAttribute("data-theme");
  await page.click("#themeToggleBtn");
  const after = await page.locator("html").getAttribute("data-theme");
  expect(after).not.toBe(before);
});

test("Theme choice is saved and persists after reload", async ({ page }) => {
  await page.click("#themeToggleBtn");
  const chosen = await page.locator("html").getAttribute("data-theme");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", chosen);
});