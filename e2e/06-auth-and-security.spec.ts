import { test, expect } from "@playwright/test";

test.describe("06: Authentication & Form Validation", () => {
  test("login page renders credentials form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText(/Entrar|Log in|Acceder|Connexion|Accedi/i);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test("register page supports up to 100 character usernames", async ({ page }) => {
    await page.goto("/register");
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toBeVisible();

    const longUsername = "Miguel_Angelo_MFSTECH_Platform_Super_Admin_Contributor_Developer_Engine_2026";
    await nameInput.fill(longUsername);
    await expect(nameInput).toHaveValue(longUsername);
  });
});
