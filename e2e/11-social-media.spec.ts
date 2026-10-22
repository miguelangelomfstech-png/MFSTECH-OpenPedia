import { test, expect } from "@playwright/test";

test.describe("11: MFSTECH SOCIAL — Mídia Social, YouTube, Google Fotos e Comentários", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

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
    await expect(directLink).toHaveText(/Assistir no YouTube|Watch on YouTube/i);
    await expect(directLink).toHaveAttribute("target", "_blank");
    const href = await directLink.getAttribute("href");
    expect(href).toMatch(/(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/);
  });

  test("exibe álbum e integração com Google Fotos com botão de redirecionamento", async ({ page }) => {
    await page.goto("/social");

    // Localiza o card do álbum do Google Fotos
    const photosCard = page.locator("[data-testid='google-photos-card']").filter({ has: page.locator("[data-testid='google-photos-direct-link'][href*='photos']") }).first();
    await expect(photosCard).toBeVisible();

    // Valida o botão direto para o Google Fotos
    const directLink = photosCard.locator("[data-testid='google-photos-direct-link']");
    await expect(directLink).toBeVisible();
    await expect(directLink).toHaveText(/Abrir no Google Fotos|Open in Google Photos/i);
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
    const commentInput = commentsSection.locator("[data-testid='comment-content-input']");
    const testCommentText = `Comentário de Teste Automatizado ${Date.now()}`;
    await commentInput.fill(testCommentText);

    // Submete o comentário
    const submitBtn = commentsSection.locator("[data-testid='comment-submit-btn']");
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
    await modal.locator("[data-testid='post-title-input']").fill(postTitle);
    await modal.locator("[data-testid='post-content-input']").fill("Partilhando um vídeo essencial de demonstração.");
    await modal.locator("[data-testid='post-media-input']").fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

    // Submete a publicação
    await modal.locator("[data-testid='post-submit-btn']").click();

    // Aguarda o fecho do modal e aparição no feed
    await expect(modal).not.toBeVisible();
    await expect(page.locator(`h3:has-text('${postTitle}')`)).toBeVisible({ timeout: 10000 });

    // Verifica que o novo player do YouTube foi gerado para o vídeo recém-publicado
    const newYtCard = page.locator(`article:has-text('${postTitle}') [data-testid='youtube-card']`);
    await expect(newYtCard).toBeVisible();
    const iframe = newYtCard.locator("iframe");
    expect(await iframe.getAttribute("src")).toContain("dQw4w9WgXcQ");
  });

  test("permite alternar idiomas no MFSTECH SOCIAL e atualiza os textos de interface (PT, EN, ES)", async ({ page }) => {
    await page.goto("/social");

    // Localiza seletor de idiomas do MFSTECH SOCIAL
    const langSelect = page.locator("#social-language-select");
    await expect(langSelect).toBeVisible();

    // Comuta para Inglês (EN)
    await langSelect.selectOption("en");
    await expect(page.locator("text=Community").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=YouTube Videos").first()).toBeVisible();
    await expect(page.locator("text=Watch on YouTube").first()).toBeVisible();

    // Aguarda seletor estar disponível
    await expect(langSelect).toBeEnabled();

    // Comuta para Espanhol (ES)
    await langSelect.selectOption("es");
    await expect(page.locator("text=Comunidad").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Ver en YouTube").first()).toBeVisible();

    // Aguarda seletor estar disponível
    await expect(langSelect).toBeEnabled();

    // Retorna para Português (PT)
    await langSelect.selectOption("pt");
    await expect(page.locator("text=Comunidade").first()).toBeVisible({ timeout: 10000 });
  });

  test("exibe opções de controle de conta (Entrar / Criar Conta) no cabeçalho para visitantes", async ({ page }) => {
    await page.goto("/social");

    // Localiza secção de controlo de conta
    const accountControl = page.locator("[data-testid='social-account-control']");
    await expect(accountControl).toBeVisible();

    // Valida presença dos botões de login e registro direcionando para /social
    const loginBtn = page.locator("[data-testid='social-login-btn']");
    await expect(loginBtn).toBeVisible();
    await expect(loginBtn).toHaveAttribute("href", "/login?next=/social");

    const registerBtn = page.locator("[data-testid='social-register-btn']");
    await expect(registerBtn).toBeVisible();
    await expect(registerBtn).toHaveAttribute("href", "/register?next=/social");
  });

  test("permite ao administrador moderar a rede social com remoção de publicações e comentários", async ({ page }) => {
    test.setTimeout(90000);
    // 1. Efectua login com conta de administrador
    await page.goto("/login?next=/social");

    // Fecha banner RGPD se visível (suporta PT e EN)
    const rgpdBtn = page.locator("button:has-text('Aceitar Todos'), button:has-text('Apenas Necessários'), button:has-text('Accept All'), button:has-text('Essential Only')").first();
    if (await rgpdBtn.isVisible()) {
      await rgpdBtn.click();
    }

    await page.locator('input[name="email"]').fill("admin@example.com");
    await page.locator('input[name="password"]').fill("changeme-admin");
    await page.locator("button[type='submit']").click();

    // Aguarda redirecionamento de volta ao MFSTECH SOCIAL
    await page.waitForURL((url) => url.pathname === "/social", { timeout: 30000 });
    await expect(page).toHaveTitle(/MFSTECH SOCIAL/i);

    // Valida indicador visual de Administrador no cabeçalho social
    const adminIndicator = page.locator("[data-testid='social-admin-indicator']");
    await expect(adminIndicator).toBeVisible();
    await expect(adminIndicator).toContainText(/Admin/i);

    // Valida perfil do administrador logado
    const profileBtn = page.locator("[data-testid='social-user-profile-btn']");
    await expect(profileBtn).toBeVisible();
    await expect(profileBtn).toContainText(/Admin/i);

    // 2. Testa criação e remoção imediata de publicação pelo administrador
    const openBtn = page.locator("#open-create-post-btn");
    await openBtn.click();
    const modal = page.locator("div[role='dialog']");
    await expect(modal).toBeVisible();

    const deletePostTitle = `Post Teste Para Remover ${Date.now()}`;
    await modal.locator("[data-testid='post-title-input']").fill(deletePostTitle);
    await modal.locator("[data-testid='post-content-input']").fill("Publicação criada para teste de moderação administrativa.");
    await modal.locator("[data-testid='post-submit-btn']").click();

    // Aguarda fechamento do modal e que o post apareça no feed
    await expect(modal).not.toBeVisible({ timeout: 30000 });
    await expect(page.locator(`h3:has-text('${deletePostTitle}')`)).toBeVisible({ timeout: 30000 });

    // Localiza o card da publicação criada e clica no botão de remover com aceitação do diálogo
    page.once("dialog", (dialog) => dialog.accept());
    const postToDelete = page.locator(`article:has-text('${deletePostTitle}')`);
    const deletePostBtn = postToDelete.locator("[data-testid='delete-post-btn']");
    await expect(deletePostBtn).toBeVisible();
    await deletePostBtn.click();

    // Valida que a publicação foi removida do feed
    await expect(page.locator(`h3:has-text('${deletePostTitle}')`)).not.toBeVisible({ timeout: 30000 });

    // 3. Testa remoção de comentário pelo administrador
    const firstPost = page.locator("[data-testid='social-post-card']").first();
    const commentsSection = firstPost.locator("[data-testid='comments-section']");
    const testCommentText = `Comentário Teste Para Moderação ${Date.now()}`;

    await commentsSection.locator("[data-testid='comment-content-input']").fill(testCommentText);
    await commentsSection.locator("[data-testid='comment-submit-btn']").click();

    // Valida que o comentário apareceu
    const commentItem = commentsSection.locator(`div[data-testid='comment-item']:has-text('${testCommentText}')`);
    await expect(commentItem).toBeVisible({ timeout: 30000 });

    // Clica no botão de remoção do comentário
    const deleteCommentBtn = commentItem.locator("[data-testid='delete-comment-btn']");
    await expect(deleteCommentBtn).toBeVisible();
    await deleteCommentBtn.click();

    // Valida que o comentário foi removido em tempo real
    await expect(commentsSection.locator(`text=${testCommentText}`)).not.toBeVisible({ timeout: 30000 });
  });

  test("permite carregar foto e exibe a imagem real com suporte a zoom/lightbox no feed", async ({ page }) => {
    await page.goto("/social");

    // Fecha banner RGPD se visível
    const rgpdBtn = page.locator("button:has-text('Aceitar Todos'), button:has-text('Apenas Necessários')").first();
    if (await rgpdBtn.isVisible()) {
      await rgpdBtn.click();
    }

    // Abre o modal de criação de post
    const openBtn = page.locator("#open-create-post-btn");
    await openBtn.click();
    const modal = page.locator("div[role='dialog']");
    await expect(modal).toBeVisible();

    // Valida a presença do botão de carregar foto do dispositivo
    const uploadPhotoBtn = modal.locator("#upload-photo-btn");
    await expect(uploadPhotoBtn).toBeVisible();

    // Preenche com um link de foto direto (ou Google Photos image URL)
    const photoTitle = `Foto Fotografia Real Teste ${Date.now()}`;
    await modal.locator("[data-testid='post-title-input']").fill(photoTitle);
    await modal.locator("[data-testid='post-content-input']").fill("Publicação de teste com imagem fotográfica real.");
    
    // Simula uma imagem válida em base64 (pixel transparente 1x1 png)
    const samplePhotoUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    await modal.locator("[data-testid='post-media-input']").fill(samplePhotoUrl);

    // Submete a publicação
    await modal.locator("[data-testid='post-submit-btn']").click();

    // Valida fechamento do modal e que o post aparece com a imagem real <img>
    await expect(modal).not.toBeVisible({ timeout: 30000 });
    const createdPost = page.locator(`article:has-text('${photoTitle}')`);
    await expect(createdPost).toBeVisible({ timeout: 30000 });

    // Valida que a imagem real <img> está renderizada dentro do GooglePhotosCard
    const renderedImg = createdPost.locator("[data-testid='google-photos-card'] img");
    await expect(renderedImg).toBeVisible();
    await expect(renderedImg).toHaveAttribute("src", samplePhotoUrl);

    // Valida abertura do Lightbox ao clicar na imagem
    await renderedImg.click();
    const lightboxModal = page.locator("div[role='dialog']:has(img[alt='Ampliação'])");
    await expect(lightboxModal).toBeVisible();

    // Fecha o Lightbox
    const closeLightboxBtn = lightboxModal.locator("button[title='Fechar']");
    await closeLightboxBtn.click();
    await expect(lightboxModal).not.toBeVisible();
  });
});


