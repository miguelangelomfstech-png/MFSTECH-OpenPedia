import { test, expect } from "@playwright/test";

test.describe("04: Search & Autocomplete Suggestions", () => {
  test("autocomplete suggests articles when typing in search box", async ({ page }) => {
    await page.goto("/");
    const searchInput = page.locator("#site-search");
    await searchInput.fill("solar");

    // Wait for debounced suggest response
    const suggestions = page.locator("#search-suggestions");
    await expect(suggestions).toBeVisible({ timeout: 5000 });
    await expect(suggestions.locator("li")).toContainText(["Solar System"]);
  });

  test("full search page performs database search without error", async ({ page }) => {
    await page.goto("/search?q=solar");

    // Must NOT display "Search is temporarily unavailable"
    const errorAlert = page.locator('p[role="alert"]:has-text("Search is temporarily unavailable"), p[role="alert"]:has-text("indisponível")');
    await expect(errorAlert).not.toBeVisible();

    // Must display matching articles
    const results = page.locator("ul.space-y-4");
    await expect(results).toBeVisible();
    await expect(results).toContainText("Solar System");

    // Tab navigation exists
    const tabs = page.locator('nav[aria-label="Result type"]');
    await expect(tabs).toBeVisible();
  });
});
