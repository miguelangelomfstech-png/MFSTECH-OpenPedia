import { test, expect } from "@playwright/test";

test.describe("03: GDPR / RGPD Compliance & Privacy", () => {
  test("displays GDPR banner on first visit and saves consent", async ({ page, context }) => {
    // Clear cookies & storage to simulate clean visit
    await context.clearCookies();
    await page.goto("/");

    const gdprBanner = page.locator('div[role="region"][aria-label*="RGPD"], div[role="region"][aria-label*="GDPR"]');
    await expect(gdprBanner).toBeVisible({ timeout: 5000 });

    const acceptBtn = page.locator("#gdpr-accept-all-btn");
    await expect(acceptBtn).toBeVisible();
    await acceptBtn.click();

    await expect(gdprBanner).not.toBeVisible();

    // Verify localStorage has consent recorded
    const consent = await page.evaluate(() => localStorage.getItem("mfstech_gdpr_consent"));
    expect(consent).toBeTruthy();
    expect(JSON.parse(consent!)).toHaveProperty("choice", "all");

    // Verify banner does not reappear on reload
    await page.reload();
    await expect(gdprBanner).not.toBeVisible();
  });

  test("privacy policy page loads with full legal sections", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("h1")).toContainText(/RGPD|GDPR|Privacidade|Privacy/i);
    await expect(page.locator("article")).toBeVisible();
    await expect(page.locator("section")).toHaveCount(5);
  });

  test("registration form requires GDPR acceptance", async ({ page }) => {
    await page.goto("/register");
    const checkbox = page.locator('input[type="checkbox"][name="gdprConsent"]');
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toHaveAttribute("required", "");
  });
});
