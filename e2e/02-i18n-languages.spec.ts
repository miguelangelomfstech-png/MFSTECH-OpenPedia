import { test, expect } from "@playwright/test";

test.describe("02: Internationalization (i18n) - 5 Languages", () => {
  const languages = [
    { code: "pt", label: "Português", hero: "A enciclopédia livre que qualquer pessoa pode editar.", search: "Pesquisar na enciclopédia" },
    { code: "en", label: "English", hero: "The free encyclopedia anyone can edit.", search: "Search the encyclopedia" },
    { code: "es", label: "Español", hero: "La enciclopedia libre que cualquiera puede editar.", search: "Buscar en la enciclopedia" },
    { code: "fr", label: "Français", hero: "L'encyclopédie libre que chacun peut modifier.", search: "Rechercher dans l'encyclopédie" },
    { code: "it", label: "Italiano", hero: "L'enciclopedia libera che tutti possono modificare.", search: "Cerca nell'enciclopedia" },
  ];

  for (const lang of languages) {
    test(`switches to ${lang.label} (${lang.code}) and translates UI elements`, async ({ page }) => {
      await page.goto("/");
      const langBtn = page.locator("#language-selector-btn");
      await langBtn.click();

      const option = page.locator(`button[role="menuitem"]:has-text("${lang.label}")`);
      await option.click();

      // Ensure page updates
      await expect(page.locator("html")).toHaveAttribute("lang", lang.code);
      await expect(page.locator("body")).toContainText(lang.hero);
      await expect(page.locator("#site-search")).toHaveAttribute("placeholder", lang.search);
    });
  }
});
