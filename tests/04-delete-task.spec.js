import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {

  await page.goto('http://127.0.0.1:5500/CODE/index.html');

  await page.evaluate(() => localStorage.clear());

  await page.reload();

  await page.fill('#taskInput', 'Delete Me');

  await page.click('#addTaskBtn');
});

test('User can delete task', async ({ page }) => {

  page.on('dialog', dialog => dialog.accept());

  await page.click('.delete-btn');

  await expect(page.locator('.task-item')).toHaveCount(0);
});