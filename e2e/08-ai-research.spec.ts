import { test, expect } from "@playwright/test";

test.describe("08: Free AI Research Assistant & Clipboard Copy", () => {
  test("POST /api/ai-research generates encyclopedic text with free AI", async ({ request }) => {
    const res = await request.post("/api/ai-research", {
      data: {
        query: "Sistema Solar",
        mode: "summary",
        language: "pt",
      },
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("text");
    expect(data.text.length).toBeGreaterThan(20);
    expect(data).toHaveProperty("perplexityUrl");
    expect(data.perplexityUrl).toContain("perplexity.ai");
    expect(data).toHaveProperty("duckduckgoUrl");
    expect(data.duckduckgoUrl).toContain("duckduckgo.com");
  });

  test("opens AI modal from header, generates answer and offers copy button", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");

    // Open AI Research Modal
    const openBtn = page.locator("#open-ai-research-btn").first();
    await expect(openBtn).toBeVisible();
    await openBtn.click();

    // Verify modal elements
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(page.locator("#ai-modal-title")).toBeVisible();

    const queryInput = page.locator("#ai-query-input");
    await expect(queryInput).toBeVisible();
    await queryInput.fill("Telescópio Espacial");

    // Click search with AI
    const searchBtn = modal.locator('button[type="submit"]');
    await searchBtn.click();

    // Verify copy button and result appear
    const copyBtn = page.locator("#ai-copy-btn");
    await expect(copyBtn).toBeVisible({ timeout: 15000 });

    // Verify external free AI links are displayed
    await expect(modal.locator('a[href*="perplexity.ai"]')).toBeVisible();
    await expect(modal.locator('a[href*="duckduckgo.com"]')).toBeVisible();

    // Test copy button interaction
    await copyBtn.click();
    await expect(copyBtn).toContainText(/Copiado|Copied/i);

    // Close modal via Escape
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
  });
});
