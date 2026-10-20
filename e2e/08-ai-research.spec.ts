import { test, expect } from "@playwright/test";

test.describe("08: Free AI Research Assistant & Clipboard Copy", () => {
  test("POST /api/ai-research generates factual encyclopedic text for 'quem descobriu o brasil'", async ({ request }) => {
    const res = await request.post("/api/ai-research", {
      data: {
        query: "quem descobriu o brasil",
        mode: "article",
        language: "pt",
      },
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("text");
    expect(data.text.length).toBeGreaterThan(50);
    // Must be coherent and mention historical discoverer / context
    expect(data.text).toMatch(/Cabral|1500|Portugal|Vera Cruz|Santa Cruz/i);
    expect(data).toHaveProperty("perplexityUrl");
    expect(data.perplexityUrl).toContain("perplexity.ai");
    expect(data).toHaveProperty("duckduckgoUrl");
    expect(data.duckduckgoUrl).toContain("duckduckgo.com");
  });

  test("POST /api/ai-research answers recipe queries with ingredients and preparation steps (not history)", async ({
    request,
  }) => {
    const res = await request.post("/api/ai-research", {
      data: {
        query: "Qual a receita de fazer um bolo de chocolate",
        mode: "article",
        language: "pt",
      },
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("text");
    expect(data.text.length).toBeGreaterThan(50);
    // Must contain recipe content: ingredients or preparation
    expect(data.text).toMatch(/ingrediente|preparo|margarina|manteiga|ovos|a[cç][uú]car|farinha|chocolate/i);
    // Must NOT be purely the history of chocolate
    expect(data.text).not.toContain("A história do bolo começou no antigo Egito");
  });

  test("opens AI modal centered, answers query, closes on copy, esc and close button", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");

    // 1. Open AI Research Modal
    const openBtn = page.locator("#open-ai-research-btn").first();
    await expect(openBtn).toBeVisible();
    await openBtn.click();

    // Verify modal elements and centering
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    const card = modal.locator(".card").first();
    await expect(card).toBeVisible();

    const box = await card.boundingBox();
    const viewport = page.viewportSize();
    if (box && viewport) {
      // Ensure vertical centering (not stuck at the very top: box.y > 20px)
      expect(box.y).toBeGreaterThan(20);
      // Ensure horizontal centering
      const centerX = box.x + box.width / 2;
      expect(Math.abs(centerX - viewport.width / 2)).toBeLessThan(50);
    }

    // 2. Test Close via Close Button ✕
    const closeBtn = page.locator("#close-ai-modal-btn");
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(modal).not.toBeVisible();

    // 3. Re-open modal and test Escape key closure
    await openBtn.click();
    await expect(modal).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();

    // 4. Re-open modal and test search + auto-close on copy
    await openBtn.click();
    await expect(modal).toBeVisible();

    const queryInput = page.locator("#ai-query-input");
    await queryInput.fill("Qual a receita de fazer um bolo de chocolate");

    const searchBtn = modal.locator('button[type="submit"]');
    await searchBtn.click();

    // Verify result textarea appears with recipe content
    const resultTextarea = modal.locator("textarea");
    await expect(resultTextarea).toBeVisible({ timeout: 15000 });
    const content = await resultTextarea.inputValue();
    expect(content).toMatch(/ingrediente|preparo|margarina|manteiga|ovos|a[cç][uú]car|farinha|chocolate/i);

    // Verify copy button
    const copyBtn = page.locator("#ai-copy-btn");
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    // Verify modal auto-closes after copying so user can paste on site
    await expect(modal).not.toBeVisible({ timeout: 2000 });
  });
});
