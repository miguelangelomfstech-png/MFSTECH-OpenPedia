import { test, expect } from "@playwright/test";

test.describe("11: MFSTECH SOCIAL — Mídia Social, YouTube, Google Fotos e Comentários", () => {
  test("acessa /social com identidade visual, branding e contacto mfstechsocial@gmail.com", async ({ page }) => {
    await page.goto("/social");

    // Valida título da página
    await expect(page).toHaveTitle(/MFSTECH SOCIAL/i);

    // Valida elementos de marca no cabeçalho
    const brandHeading = page.locator("h1:has-text('MFSTECH SOCIAL')");
    await expect(brandHeading).toBeVisible();

    // Valida presença do email de contacto oficial
    const contactLinks = page.locator("a[href='mailto:mfstechsocial@gmail.com']");
    await expect(contactLinks.first()).toBeVisible();

    // Valida link do YouTube no cabeçalho
    const ytHeaderLink = page.locator("#header-youtube-link");
    await expect(ytHeaderLink).toBeVisible();
    await expect(ytHeaderLink).toHaveAttribute("target", "_blank");
  });

  test("executa vídeo do YouTube diretamente no site e oferece botão de link direto para o YouTube", async ({ page }) => {
    await page.goto("/social");

    // Localiza o card do YouTube
    const ytCard = page.locator("[data-testid='youtube-card']").first();
    await expect(ytCard).toBeVisible();

    // Valida que o player de vídeo é executado dentro da página através de iframe responsivo
    const iframe = ytCard.locator("iframe");
    await expect(iframe).toBeVisible();
    const src = await iframe.getAttribute("src");
    expect(src).toMatch(/youtube(-nocookie)?\.com\/embed\/[a-zA-Z0-9_-]{11}/);

    // Valida a presença do botão de acesso direto ao YouTube
    const directLink = ytCard.locator("[data-testid='youtube-direct-link']");
    await expect(directLink).toBeVisible();
    await expect(directLink).toHaveText(/Assistir no YouTube/i);
    await expect(directLink).toHaveAttribute("target", "_blank");
    const href = await directLink.getAttribute("href");
    expect(href).toMatch(/youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}/);
  });

  test("exibe álbum e integração com Google Fotos com botão de redirecionamento", async ({ page }) => {
    await page.goto("/social");

    // Localiza o card do Google Fotos
    const photosCard = page.locator("[data-testid='google-photos-card']").first();
    await expect(photosCard).toBeVisible();

    // Valida o botão direto para o Google Fotos
    const directLink = photosCard.locator("[data-testid='google-photos-direct-link']");
    await expect(directLink).toBeVisible();
    await expect(directLink).toHaveText(/Abrir no Google Fotos/i);
    await expect(directLink).toHaveAttribute("target", "_blank");
    const href = await directLink.getAttribute("href");
    expect(href).toMatch(/photos\.app\.goo\.gl|photos\.google\.com/);
  });

  test("permite adicionar e visualizar comentários em tempo real em qualquer publicação", async ({ page }) => {
    await page.goto("/social");

    const firstPost = page.locator("[data-testid='social-post-card']").first();
    await expect(firstPost).toBeVisible();

    const commentsSection = firstPost.locator("[data-testid='comments-section']");
    await expect(commentsSection).toBeVisible();

    // Preenche o campo de comentário
    const commentInput = commentsSection.locator("input[placeholder*='comentário']");
    const testCommentText = `Comentário de Teste Automatizado ${Date.now()}`;
    await commentInput.fill(testCommentText);

    // Submete o comentário
    const submitBtn = commentsSection.locator("button:has-text('Comentar')");
    await submitBtn.click();

    // Verifica que o comentário aparece na lista de comentários em tempo real
    await expect(commentsSection.locator(`text=${testCommentText}`)).toBeVisible({ timeout: 10000 });
  });

  test("permite criar nova publicação com link de vídeo do YouTube e exibe o player imediatamente", async ({ page }) => {
    await page.goto("/social");

    // Fecha banner RGPD se visível para liberar cliques
    const rgpdBtn = page.locator("button:has-text('Aceitar Todos'), button:has-text('Apenas Necessários')").first();
    if (await rgpdBtn.isVisible()) {
      await rgpdBtn.click();
    }

    // Abre o modal de criação de post
    const openBtn = page.locator("#open-create-post-btn");
    await expect(openBtn).toBeVisible();
    await openBtn.click();

    const modal = page.locator("div[role='dialog']");
    await expect(modal).toBeVisible();

    // Preenche formulário
    const postTitle = `Vídeo de Engenharia ${Date.now()}`;
    await modal.locator("input[placeholder*='Novidades']").fill(postTitle);
    await modal.locator("textarea").fill("Partilhando um vídeo essencial de demonstração.");
    await modal.locator("input[placeholder*='Cole aqui o link']").fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

    // Submete a publicação
    await modal.locator("button:has-text('Publicar Agora')").click();

    // Aguarda o fecho do modal e aparição no feed
    await expect(modal).not.toBeVisible();
    await expect(page.locator(`h3:has-text('${postTitle}')`)).toBeVisible({ timeout: 10000 });

    // Verifica que o novo player do YouTube foi gerado para o vídeo recém-publicado
    const newYtCard = page.locator(`article:has-text('${postTitle}') [data-testid='youtube-card']`);
    await expect(newYtCard).toBeVisible();
    const iframe = newYtCard.locator("iframe");
    expect(await iframe.getAttribute("src")).toContain("dQw4w9WgXcQ");
  });
});
