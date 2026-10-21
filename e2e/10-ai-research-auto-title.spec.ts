import { test, expect } from "@playwright/test";

test.describe("10: AI Research Automatic Title Population in Editor", () => {
  test("POST /api/ai-research returns suggested title for researched queries", async ({ request }) => {
    // 1. Test recipe query
    const resRecipe = await request.post("/api/ai-research", {
      data: {
        query: "Qual a receita de fazer um bolo de chocolate",
        mode: "article",
        language: "pt",
      },
    });
    expect(resRecipe.status()).toBe(200);
    const dataRecipe = await resRecipe.json();
    expect(dataRecipe).toHaveProperty("title");
    expect(dataRecipe.title).toMatch(/Bolo de Chocolate/i);

    // 2. Test discover query
    const resDiscover = await request.post("/api/ai-research", {
      data: {
        query: "quem descobriu o brasil",
        mode: "article",
        language: "pt",
      },
    });
    expect(resDiscover.status()).toBe(200);
    const dataDiscover = await resDiscover.json();
    expect(dataDiscover).toHaveProperty("title");
    expect(dataDiscover.title).toMatch(/Cabral|Descobrimento|Brasil/i);
  });

  test("inserting AI research into article fills both content and related Title field", async ({ page }) => {
    // Navigate to create new article
    await page.goto("/wiki/new/edit");

    const titleInput = page.locator("#title");
    await expect(titleInput).toBeVisible();
    await expect(titleInput).toHaveValue("");

    const contentArea = page.locator('textarea[name="content"]');
    await expect(contentArea).toBeVisible();
    await expect(contentArea).toHaveValue("");

    // Open AI Research Modal from toolbar
    const openAiBtn = page.locator("#open-ai-research-btn").last();
    await expect(openAiBtn).toBeVisible();
    await openAiBtn.click();

    // Query AI for a recipe
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();

    const queryInput = page.locator("#ai-query-input");
    await queryInput.fill("Qual a receita de fazer um bolo de chocolate");
    await queryInput.press("Enter");

    // Wait for result and suggested title
    const insertBtn = page.locator("#ai-insert-btn");
    await expect(insertBtn).toBeVisible({ timeout: 15000 });

    const suggestedTitleBadge = page.locator("#ai-suggested-title");
    await expect(suggestedTitleBadge).toBeVisible();
    const suggestedTitleText = await suggestedTitleBadge.textContent();
    expect(suggestedTitleText).toMatch(/Bolo de Chocolate/i);

    // Click 'Inserir no Artigo'
    await insertBtn.click();

    // Modal should close
    await expect(modal).not.toBeVisible();

    // Title field MUST be populated with content-related title
    await expect(titleInput).toHaveValue(/Bolo de Chocolate/i);

    // Content textarea MUST have inserted content
    const contentVal = await contentArea.inputValue();
    expect(contentVal.length).toBeGreaterThan(30);

    // Append unique timestamp to avoid 'No changes were made' if article already existed
    await contentArea.fill(contentVal + `\n\n*Publicado em: ${Date.now()}*`);

    // Save and publish article
    const submitBtn = page.locator("#save-article-btn");
    await submitBtn.click();

    // Verify redirect to published page with the related title
    await expect(page).not.toHaveURL(/\/wiki\/new\/edit/, { timeout: 15000 });
    await expect(page.locator("h1").first()).toContainText(/Bolo de Chocolate/i, { timeout: 10000 });
  });
});
