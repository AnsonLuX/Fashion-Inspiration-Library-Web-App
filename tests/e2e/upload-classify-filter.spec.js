const { test, expect } = require("@playwright/test");
const path = require("path");

test("upload, classify, and filter workflow", async ({ page }) => {
  await page.goto("/");
  const designerName = `Test Designer ${Date.now()}`;

  const imagePath = path.join(
    __dirname,
    "..",
    "..",
    "eval",
    "dataset",
    "images",
    "pexels-yemendol-33420820.jpg"
  );

  await page.getByPlaceholder("Designer name").fill(designerName);
  await page.locator('input[type="file"]').setInputFiles(imagePath);
  await page.getByRole("button", { name: /upload image/i }).click();

  await expect(page.getByText(`Designer: ${designerName}`).first()).toBeVisible();

  const firstClassifyButton = page
    .getByRole("button", { name: /classify|reclassify/i })
    .first();
  await firstClassifyButton.click();

  await expect(
    page.getByRole("button", { name: /reclassify|retry classification/i }).first()
  ).toBeVisible({ timeout: 30000 });

  await expect(page.getByText(/Status:\s*success/i).first()).toBeVisible({
    timeout: 30000,
  });

  await page.getByLabel("Designer").selectOption(designerName);

  await expect(page.locator("article")).toHaveCount(1);
  await expect(page.getByText(`Designer: ${designerName}`)).toBeVisible();
});
