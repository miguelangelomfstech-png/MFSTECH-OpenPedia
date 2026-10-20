import { test, expect } from "@playwright/test";

test.describe("02: Internationalization (i18n) - 5 Languages", () => {
  const languages = [
    { code: "pt", label: "Português", hero: "A enciclopédia livre que qualquer pessoa pode editar.", search: "Pesquisar na enciclopédia" },
    { code: "en", label: "English", hero: "The free encyclopedia anyone can edit.", search: "Search the encyclopedia" },
    { code: "es", label: "Español", hero: "La enciclopedia libre que cualquiera pode editar.", search: "Buscar en la enciclopedia" },
    { code: "fr", label: "Français", hero: "L'encyclopédie libre que chacun peut modifier.", search: "Rechercher dans l'encyclopédie" },
    { code: "it", label: "Italiano", hero: "L'enciclopedia libera che tutti possono modificare.", search: "Cerca nell'enciclopedia" },
  ];

  for (const lang of languages) {
    test(`switches to ${lang.label} (${lang.code}) and translates UI elements`, async ({ page }) => {
      await page.goto("/");
      await page.selectOption("#language-select", lang.code);

      // Verify html lang attribute
      await expect(page.locator("html")).toHaveAttribute("lang", lang.code);

      // Verify translated search placeholder
      await expect(page.locator("#site-search")).toHaveAttribute("placeholder", lang.search);
    });
  }
});
