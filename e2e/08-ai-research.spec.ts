import { test, expect } from "@playwright/test";

test.describe("08: Free AI Research Assistant & Clipboard Copy", () => {
  test.beforeEach(async () => {
    test.setTimeout(60000);
  });

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

  test("POST /api/ai-research answers complex questions completely inside the box without fallback links", async ({
    request,
  }) => {
    const complexQuery =
      "Como funciona a fusão nuclear e quais são os principais desafios para a geração comercial de energia elétrica no planeta?";
    const res = await request.post("/api/ai-research", {
      data: {
        query: complexQuery,
        mode: "article",
        language: "pt",
      },
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("text");
    expect(data.text.length).toBeGreaterThan(100);
    // Must NOT tell the user to click links
    expect(data.text).not.toContain("Não foi possível obter uma resposta imediata");
    expect(data.text).not.toContain("Utilize os links abaixo");
    // Must contain substantive physics content
    expect(data.text).toMatch(/fus[aã]o|n[uú]cleo|energia|plasma|rea[cç][aã]o|temperatura|press[aã]o|sol/i);
  });

  test("POST /api/ai-research answers 'sobre o linux, me informe o melhor, como performance economia de espacos e etc' with complete distro info", async ({
    request,
  }) => {
    const linuxQuery = "sobre o linux, me informe o melhor, como performance economia de espacos e etc";
    const res = await request.post("/api/ai-research", {
      data: {
        query: linuxQuery,
        mode: "article",
        language: "pt",
      },
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("text");
    expect(data.text.length).toBeGreaterThan(150);
    // Must NOT contain any error message
    expect(data.text).not.toContain("Ocorreu um erro ao consultar a IA gratuita");
    expect(data.text).not.toContain("Não foi possível obter uma resposta imediata");
    // Must mention lightweight/high-performance distributions
    expect(data.text).toMatch(/Alpine|Puppy|Lubuntu|Xubuntu|antiX|Arch|Debian/i);
    // Must mention RAM / memory and space / disk economy
    expect(data.text).toMatch(/RAM|mem[oó]ria|espa[çc]o|disco/i);
    // Suggested title must be meaningful
    expect(data.title).toMatch(/Linux|Distribuiç[õo]es/i);
  });

  test("POST /api/ai-research answers Selenium Java HTML form mapping and test planning query with real code", async ({
    request,
  }) => {
    const javaQuery =
      "Preciso de um codigo em java , selenium , que teste uma determinada pagina html, mas antes ele le o conteudo do html e mapeie todos os campos de entrada de dados e faça uma analise do que ira testar";
    const res = await request.post("/api/ai-research", {
      data: {
        query: javaQuery,
        mode: "article",
        language: "pt",
      },
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("text");
    expect(data.text.length).toBeGreaterThan(500);
    // Must NOT contain generic encyclopedic boilerplate
    expect(data.text).not.toContain("é um tema de relevante interesse enciclopédico");
    expect(data.text).not.toContain("Fatores históricos, científicos e sociais");
    expect(data.text).not.toContain("Ocorreu um erro ao consultar a IA gratuita");
    // Must contain actual Java code and Selenium methods
    expect(data.text).toContain("public class HtmlFormDynamicTester");
    expect(data.text).toContain("WebDriverManager");
    expect(data.text).toContain("analyzeFormAndPlanTests");
    expect(data.text).toMatch(/findElements\(\s*By\.cssSelector/);
    // Suggested title must be clean and not the raw conversational query
    expect(data.title).toMatch(/Selenium|Java|Automação/i);
    expect(data.title).not.toMatch(/^Preciso de um Codigo/i);
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
    await queryInput.press("Enter");

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
