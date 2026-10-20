import { test, expect } from "@playwright/test";

test.describe("01: Homepage, Branding & Navigation", () => {
  test("loads homepage with MFSTECH-OpenPedia logo and title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/MFSTECH-OpenPedia/i);

    // Verify logo image
    const logo = page.locator('img[alt="MFSTECH-OpenPedia logo"]');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("src", "/mfstech_logo.jpg");

    // Verify brand typography
    const brand = page.locator("header");
    await expect(brand).toContainText("MFSTECH");
    await expect(brand).toContainText("OpenPedia");
  });

  test("displays hero section and call to actions", async ({ page }) => {
    await page.goto("/");
    const startWritingBtn = page.getByRole("link", { name: /Começar a escrever|Start writing|Empezar a escribir|Commencer à écrire|Inizia a scrivere/i });
    await expect(startWritingBtn).toBeVisible();
    await expect(startWritingBtn).toHaveAttribute("href", "/wiki/new/edit");
  });

  test("displays header navigation items", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#site-search")).toBeVisible();
    await expect(page.locator("#theme-toggle")).toBeVisible();
    await expect(page.locator("#language-selector-btn")).toBeVisible();
  });
});
