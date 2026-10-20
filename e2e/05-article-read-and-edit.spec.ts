import { test, expect } from "@playwright/test";

test.describe("05: Article Reading & Creation/Editor", () => {
  test("renders existing article with wiki styling and tabs", async ({ page }) => {
    await page.goto("/wiki/solar-system");
    await expect(page.locator("h1")).toContainText("Solar System");

    // Action tabs: Article, Talk, Edit, History, Watch
    const articleNav = page.locator('nav[aria-label="Article navigation"], header nav');
    await expect(page.getByRole("link", { name: /Artigo|Article|Voce/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Editar|Edit|Modifier|Modifica/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Histórico|History|Historial|Cronologia/i })).toBeVisible();
  });

  test("new article editor starts with clean, empty title input without sandbox prefill", async ({ page }) => {
    await page.goto("/wiki/new/edit");

    // Verify title input is empty
    const titleInput = page.locator('input[name="title"]');
    await expect(titleInput).toBeVisible();
    await expect(titleInput).toHaveValue("");
    await expect(titleInput).toHaveAttribute("placeholder", /Título do artigo|Article title/i);

    // Verify heading says Create a new article
    const heading = page.locator("h1");
    await expect(heading).toContainText(/Create a new article|Criar um novo artigo/i);

    // Editor textarea is present
    await expect(page.locator('textarea[name="content"]')).toBeVisible();
  });
});
