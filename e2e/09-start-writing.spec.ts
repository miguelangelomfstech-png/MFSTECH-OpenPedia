import { test, expect } from "@playwright/test";

test.describe("09: Start Writing Navigation & Multiple Articles Creation", () => {
  test("header contains 'start writing' button across all pages, allowing multiple publications", async ({ page }) => {
    // 1. Visit homepage
    await page.goto("/");
    const headerBtn = page.locator("#header-start-writing-btn");
    await expect(headerBtn).toBeVisible();

    // 2. Click start writing from main menu
    await headerBtn.click();
    await page.waitForURL(/\/wiki\/new\/edit/);
    await expect(page).toHaveURL(/\/wiki\/new\/edit/);

    // Verify blank new article form
    const titleInput = page.locator("#title");
    await expect(titleInput).toBeVisible();
    await expect(titleInput).toHaveValue("");

    // 3. Publish first test article
    const uniqueTitle1 = `Artigo Teste Alpha ${Date.now()}`;
    await titleInput.fill(uniqueTitle1);
    const contentArea = page.locator('textarea[name="content"]');
    await contentArea.fill("Conteúdo de teste para a primeira publicação de artigo.");

    const submitBtn = page.locator("#save-article-btn");
    await submitBtn.click();

    // Wait for redirect to published article
    await expect(page).not.toHaveURL(/\/wiki\/new\/edit/);
    await expect(page.locator("h1")).toContainText(uniqueTitle1);

    // 4. On the published article page, verify main menu STILL has 'start writing' button
    await expect(headerBtn).toBeVisible();

    // Also verify article tabs have the start writing action
    const articleTabAction = page.locator('nav[aria-label="Page tabs"] a[href="/wiki/new/edit"]');
    await expect(articleTabAction).toBeVisible();

    // 5. Click start writing again to publish a second article
    await headerBtn.click();
    await page.waitForURL(/\/wiki\/new\/edit/);
    await expect(page).toHaveURL(/\/wiki\/new\/edit/);

    // Verify form is clean and ready for a new publication
    await expect(titleInput).toBeVisible();
    await expect(titleInput).toHaveValue("");
  });
});
