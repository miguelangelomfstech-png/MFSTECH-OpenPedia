# Plano de Testes — MFSTECH-OpenPedia

## 1. Identificação do Projeto e Objetivos

- **Nome do Projeto**: MFSTECH-OpenPedia
- **Versão**: 0.1.0 (Produção)
- **URL Alvo dos Testes**: `https://mfstech-openpedia.vercel.app` (e ambiente de desenvolvimento local `http://localhost:3000`)
- **Objetivo**: Garantir que todas as funcionalidades da enciclopédia operem com total correção, conformidade legal (**RGPD**), fidelidade visual de marca, estabilidade de APIs e desempenho sob múltiplos navegadores e resoluções.

---

## 2. Estratégia de Testes

A estratégia combina testes automatizados de ponta a ponta (**Playwright**) e validações de API:
1. **Testes Funcionais End-to-End (E2E)**: Simulação real do utilizador navegando, pesquisando, editando, alternando idiomas e interagindo com o banner RGPD.
2. **Testes de Internacionalização (i18n)**: Validação das 5 línguas suportadas (Português, Inglês, Espanhol, Francês e Italiano).
3. **Testes de Conformidade Regulatória (RGPD)**: Verificação de persistência de consentimento, cookies e bloqueio de criação de conta sem aceite expresso.
4. **Testes de Resiliência de Pesquisa**: Garantia de funcionamento do motor de busca tanto com Meilisearch quanto via fallback direto para PostgreSQL Neon.
5. **Testes de API e Contrato**: Verificação de status HTTP, headers e schemas JSON das rotas REST, GraphQL e Healthcheck.
6. **Cross-Browser & Responsividade**: Execução em Chromium, Firefox, WebKit (Safari) e Mobile Chrome (Pixel 7).

---

## 3. Matriz de Cenários de Teste (Test Scenarios)

| ID do Cenário | Módulo / Funcionalidade | Descrição do Cenário |
|---|---|---|
| **TS-01** | Branding e Identidade Visual | Validação de carregamento do logótipo oficial `mfstech_logo.jpg`, títulos de página e estrutura do cabeçalho. |
| **TS-02** | Internacionalização (i18n) | Alternância entre 5 idiomas (PT, EN, ES, FR, IT) e persistência do cookie `NEXT_LOCALE`. |
| **TS-03** | Privacidade e RGPD | Apresentação do banner, aceitação ("Todos" / "Necessários"), persistência e página `/privacy`. |
| **TS-04** | Motor de Pesquisa Híbrido | Autocomplete no cabeçalho e página `/search` com fallback relacional Neon PostgreSQL. |
| **TS-05** | Leitura e Navegação de Artigos | Visualização de artigos formatados, sumário (TOC), abas de navegação e wikilinks. |
| **TS-06** | Criação e Edição de Artigos | Acesso à criação sem pré-preenchimento "sandbox" no título e renderização de Markdown. |
| **TS-07** | Histórico e Diffs de Revisão | Visualização de versões anteriores, cálculo de diferenças e rastreabilidade de edições. |
| **TS-08** | Autenticação e Registo | Formulário de login, validação de nomes de utilizador de até 100 caracteres e obrigatoriedade de RGPD. |
| **TS-09** | APIs e Monitorização | Endpoints `/api/health`, `/api/suggest`, `/api/v1/articles` e `/api/graphql`. |
| **TS-10** | SEO e Indexação | Acessibilidade e integridade de `/robots.txt` e `/sitemap.xml`. |

---

## 4. Casos de Teste Detalhados (Test Cases)

### TS-01: Branding e Identidade Visual

#### TC-001: Validação do Logótipo e Nome MFSTECH-OpenPedia
- **Pré-condições**: Aplicação em execução.
- **Passos**:
  1. Aceder à rota principal `/`.
  2. Inspecionar o elemento de imagem do logótipo no cabeçalho.
  3. Verificar o texto adjacente ao logótipo.
- **Dados de Teste**: URL base.
- **Resultado Esperado**: O logótipo `/mfstech_logo.jpg` é exibido com sucesso (HTTP 200) e o texto apresenta "MFSTECH - OpenPedia".
- **Status**: **PASSOU** (Automatizado via `01-homepage-and-branding.spec.ts`).

#### TC-002: Acesso ao Botão de Ação "Começar a Escrever"
- **Passos**:
  1. Localizar o botão principal na seção hero.
  2. Verificar o atributo `href`.
- **Resultado Esperado**: O link direciona para `/wiki/new/edit` (e não para `/wiki/sandbox/edit`).
- **Status**: **PASSOU** (Automatizado).

---

### TS-02: Internacionalização (i18n)

#### TC-003: Comutação para Idioma Português (PT)
- **Passos**: Abrir o seletor de idiomas, escolher "Português".
- **Resultado Esperado**: O elemento `<html lang="pt">` é atualizado, o título hero exibe "A enciclopédia livre que qualquer pessoa pode editar" e a barra de pesquisa exibe "Pesquisar na enciclopédia".
- **Status**: **PASSOU** (Automatizado via `02-i18n-languages.spec.ts`).

#### TC-004: Comutação para Idioma Inglês (EN)
- **Passos**: Abrir o seletor de idiomas, escolher "English".
- **Resultado Esperado**: `<html lang="en">`, hero com "The free encyclopedia anyone can edit." e placeholder "Search the encyclopedia".
- **Status**: **PASSOU** (Automatizado).

#### TC-005: Comutação para Idioma Espanhol (ES)
- **Passos**: Escolher "Español".
- **Resultado Esperado**: `<html lang="es">`, hero com "La enciclopedia libre que cualquiera puede editar." e placeholder "Buscar en la enciclopedia".
- **Status**: **PASSOU** (Automatizado).

#### TC-006: Comutação para Idioma Francês (FR)
- **Passos**: Escolher "Français".
- **Resultado Esperado**: `<html lang="fr">`, hero com "L'encyclopédie libre que chacun peut modifier." e placeholder "Rechercher dans l'encyclopédie".
- **Status**: **PASSOU** (Automatizado).

#### TC-007: Comutação para Idioma Italiano (IT)
- **Passos**: Escolher "Italiano".
- **Resultado Esperado**: `<html lang="it">`, hero com "L'enciclopedia libera che tutti possono modificare." e placeholder "Cerca nell'enciclopedia".
- **Status**: **PASSOU** (Automatizado).

---

### TS-03: Privacidade e RGPD

#### TC-008: Apresentação do Banner RGPD na Primeira Visita
- **Pré-condições**: Sem cookies ou `localStorage` prévio.
- **Passos**:
  1. Carregar a homepage.
  2. Aguardar 1 segundo para renderização da animação.
- **Resultado Esperado**: O banner de consentimento surge no fundo do ecrã contendo título, descrição na língua ativa e botões "Aceitar Todos" e "Apenas Necessários".
- **Status**: **PASSOU** (Automatizado via `03-gdpr-compliance.spec.ts`).

#### TC-009: Persistência do Consentimento RGPD
- **Passos**:
  1. Clicar em "Aceitar Todos" (`#gdpr-accept-all-btn`).
  2. Verificar o valor de `localStorage.getItem("mfstech_gdpr_consent")`.
  3. Recarregar a página.
- **Resultado Esperado**: O banner desaparece imediatamente e não volta a ser exibido após recarregar.
- **Status**: **PASSOU** (Automatizado).

#### TC-010: Exibição da Página de Política de Privacidade (`/privacy`)
- **Passos**: Navegar até `/privacy`.
- **Resultado Esperado**: A página renderiza 5 seções jurídicas detalhadas contemplando direitos dos titulares, dados tratados, base legal e segurança.
- **Status**: **PASSOU** (Automatizado).

#### TC-011: Aceite Obrigatório do RGPD no Registo de Utilizadores
- **Passos**: Aceder a `/register` e inspecionar a checkbox de consentimento.
- **Resultado Esperado**: A checkbox possui o atributo `required` e link para a Política de Privacidade.
- **Status**: **PASSOU** (Automatizado).

---

### TS-04: Motor de Pesquisa Híbrido

#### TC-012: Sugestões Automáticas em Tempo Real (`/api/suggest`)
- **Passos**:
  1. Clicar no campo de pesquisa do cabeçalho.
  2. Digitar `"solar"`.
  3. Aguardar o popup de sugestões.
- **Resultado Esperado**: A lista `#search-suggestions` abre exibindo "Solar System" com resumo relevante.
- **Status**: **PASSOU** (Automatizado via `04-search-and-suggest.spec.ts`).

#### TC-013: Submissão de Pesquisa Global com Fallback Postgres
- **Passos**:
  1. Aceder a `/search?q=solar`.
  2. Verificar a presença de resultados e ausência de mensagens de erro.
- **Resultado Esperado**: A página retorna HTTP 200, exibe artigos correspondentes ("Solar System", "Sun"), trechos com termos destacados em `<mark>` e **NÃO** exibe "Search is temporarily unavailable".
- **Status**: **PASSOU** (Automatizado).

#### TC-014: Alternância entre Abas de Artigos e Multimédia
- **Passos**: Na página de pesquisa, clicar na aba "Ficheiros multimédia" / "Images & videos".
- **Resultado Esperado**: O URL muda para `/search?q=solar&type=media` e a visualização alterna para a grelha de ficheiros multimédia.
- **Status**: **PASSOU** (Automatizado).

---

### TS-05: Leitura de Artigos e Wikilinks

#### TC-015: Renderização de Artigo Existente
- **Passos**: Aceder a `/wiki/solar-system`.
- **Resultado Esperado**: Exibe o título "Solar System", abas de navegação (Artigo, Discussão, Editar, Histórico), categorias e links internos funcionais.
- **Status**: **PASSOU** (Automatizado via `05-article-read-and-edit.spec.ts`).

---

### TS-06: Criação e Edição de Artigos

#### TC-016: Validação de Título Vazio ao Criar Novo Artigo
- **Passos**:
  1. Aceder a `/wiki/new/edit`.
  2. Inspecionar o campo de input de título (`name="title"`).
- **Resultado Esperado**: O campo encontra-se vazio (sem "sandbox" pré-escrito) e com o placeholder `"Título do artigo / Article title..."`. O cabeçalho exibe "Create a new article".
- **Status**: **PASSOU** (Automatizado via `05-article-read-and-edit.spec.ts`).

---

### TS-07: Histórico e Versionamento

#### TC-017: Acesso à Página de Histórico de Revisões
- **Passos**: Aceder a `/wiki/solar-system/history`.
- **Resultado Esperado**: Lista de revisões históricas com timestamp, autor, tamanho do diff e botão para comparação.
- **Status**: **PASSOU** (Validação manual & smoke test).

---

### TS-08: Autenticação e Segurança

#### TC-018: Suporte a Nomes de Utilizador de até 100 Caracteres
- **Passos**: Aceder a `/register`, preencher o campo nome com uma string de 76 caracteres.
- **Resultado Esperado**: O input aceita a string sem truncar e a validação do Zod aceita até 100 caracteres.
- **Status**: **PASSOU** (Automatizado via `06-auth-and-security.spec.ts`).

#### TC-019: Exibição do Formulário de Login
- **Passos**: Aceder a `/login`.
- **Resultado Esperado**: Campos de email, palavra-passe e botão "Entrar" disponíveis.
- **Status**: **PASSOU** (Automatizado via `06-auth-and-security.spec.ts`).

---

### TS-09: APIs e Monitorização

#### TC-020: Verificação de Vitalidade do Sistema (`/api/health`)
- **Passos**: Fazer requisição GET a `/api/health`.
- **Resultado Esperado**: Retorna HTTP 200 com payload JSON `{"ok": true, "status": "ok", "checks": {"db": true, "redis": true}}`.
- **Status**: **PASSOU** (Automatizado via `07-api-endpoints.spec.ts`).

#### TC-021: Endpoint de Sugestões JSON (`/api/suggest`)
- **Passos**: Requisição GET a `/api/suggest?q=solar`.
- **Resultado Esperado**: Retorna HTTP 200 e array JSON com campos `title`, `slug` e `excerpt`.
- **Status**: **PASSOU** (Automatizado via `07-api-endpoints.spec.ts`).

#### TC-022: Endpoint da API REST de Artigos (`/api/v1/articles`)
- **Passos**: Requisição GET a `/api/v1/articles`.
- **Resultado Esperado**: Retorna HTTP 200 com array de artigos e metadados.
- **Status**: **PASSOU** (Automatizado).

#### TC-023: Endpoint GraphQL (`/api/graphql`)
- **Passos**: Requisição POST com query GraphQL `{ articles(limit: 2) { title slug } }`.
- **Resultado Esperado**: Retorna HTTP 200 com a resposta formatada em JSON GraphQL.
- **Status**: **PASSOU** (Automatizado).

---

### TS-10: SEO e Indexação

#### TC-024: Verificação do Ficheiro `robots.txt`
- **Passos**: Requisição GET a `/robots.txt`.
- **Resultado Esperado**: Retorna HTTP 200 com regras padrão de indexação.
- **Status**: **PASSOU** (Automatizado via `07-api-endpoints.spec.ts`).

#### TC-025: Verificação do Ficheiro `sitemap.xml`
- **Passos**: Requisição GET a `/sitemap.xml`.
- **Resultado Esperado**: Retorna HTTP 200 com XML válido contendo URLs dos artigos da enciclopédia.
- **Status**: **PASSOU** (Automatizado via `07-api-endpoints.spec.ts`).

---

### TS-11: Assistente de Pesquisa com IA Gratuita

#### TC-026: Geração de Conteúdo com IA Gratuita via Endpoint `/api/ai-research`
- **Pré-condições**: Servidor em execução.
- **Passos**:
  1. Enviar requisição POST para `/api/ai-research` com payload JSON `{"query": "Sistema Solar", "mode": "summary", "language": "pt"}`.
- **Resultado Esperado**: Retorna HTTP 200, texto factual de pelo menos 20 caracteres e URLs complementares para Perplexity AI e DuckDuckGo AI.
- **Status**: **PASSOU** (Automatizado via `08-ai-research.spec.ts`).

#### TC-027: Abertura da Janela Modal e Cópia para a Área de Transferência
- **Passos**:
  1. Clicar no botão `✨ Pesquisa IA` no cabeçalho ou no editor.
  2. Digitar "Telescópio Espacial" e submeter.
  3. Aguardar a resposta da IA.
  4. Clicar em "Copiar Resposta".
- **Resultado Esperado**: A resposta gerada é exibida na área de texto e o botão de cópia atualiza o texto para "✓ Copiado!", gravando o conteúdo na área de transferência do utilizador para colar em qualquer campo.
- **Status**: **PASSOU** (Automatizado via `08-ai-research.spec.ts`).

#### TC-028: Presença de Links Externos Gratuitos (Perplexity e DuckDuckGo AI)
- **Passos**: Inspecionar a seção de links externos na janela modal de pesquisa IA.
- **Resultado Esperado**: Apresenta links diretos para Perplexity AI e DuckDuckGo AI Chat com a pesquisa do utilizador codificada.
- **Status**: **PASSOU** (Automatizado via `08-ai-research.spec.ts`).

---

### TS-12: Navegação Contínua e Integração IA no Editor

#### TC-029: Botão "Começar a Escrever" no Menu Principal e Abas de Artigo
- **Passos**:
  1. Aceder à página inicial e verificar a presença do botão `#header-start-writing-btn` no menu principal.
  2. Clicar no botão e criar um novo artigo.
  3. Após publicação e redirecionamento para o artigo criado, verificar que o botão permanece visível no menu superior e que a aba do artigo possui a ação "Começar a escrever".
  4. Clicar novamente no botão a partir da página do artigo e verificar que o formulário de criação é limpo e pronto para novo artigo.
- **Resultado Esperado**: O utilizador consegue criar publicações consecutivas sem bloqueios.
- **Status**: **PASSOU** (Automatizado via `09-start-writing.spec.ts`).

#### TC-030: Preenchimento Automático do Campo Title ao Inserir Conteúdo da IA
- **Passos**:
  1. Aceder a `/wiki/new/edit` com o campo de título vazio.
  2. Abrir o assistente de IA através do botão `✨ Pesquisa IA`.
  3. Realizar uma pesquisa (ex.: "Qual a receita de fazer um bolo de chocolate").
  4. Verificar o badge de título sugerido no resultado da pesquisa.
  5. Clicar no botão "📥 Inserir no Artigo".
  6. Verificar que a janela modal fecha, o campo Title (`#title`) é automaticamente preenchido com o título correspondente ao conteúdo pesquisado (ex.: "Bolo de Chocolate"), e a área de conteúdo (`#content`) recebe o texto da receita.
  7. Gravar e publicar o artigo, confirmando a criação sob o título atribuído.
- **Resultado Esperado**: O campo Title é automaticamente preenchido de forma coerente com o tema e conteúdo pesquisado pela IA.
- **Status**: **PASSOU** (Automatizado via `10-ai-research-auto-title.spec.ts`).

#### TC-031: Resolução Especializada para Perguntas Técnicas e Linux (Performance e Economia de Espaço)
- **Passos**:
  1. Enviar requisição POST para `/api/ai-research` com a pergunta: `"sobre o linux, me informe o melhor, como performance economia de espacos e etc"`.
  2. Verificar o status da resposta e o corpo de texto retornado.
- **Resultado Esperado**:
  - Retorna HTTP 200 sem exibir mensagem de erro nem links evasivos.
  - Traz informação aprofundada cobrindo distribuições para economia extrema (Alpine Linux, Puppy Linux), performance diária (Lubuntu, Xubuntu, antiX) e controle técnico (Debian Minimal, Arch Linux).
  - Inclui tabela comparativa de consumo de RAM em idle, espaço mínimo em disco e perfis recomendados.
  - Sugere título coerente `"Guia Completo das Melhores Distribuições Linux: Performance e Economia de Recursos"`.
- **Status**: **PASSOU** (Automatizado via `08-ai-research.spec.ts`).

#### TC-032: Resolução Especializada para Código, Automação e Testes (Java, Selenium e Mapeamento DOM)
- **Passos**:
  1. Enviar requisição POST para `/api/ai-research` com a pergunta: `"Preciso de um codigo em java , selenium , que teste uma determinada pagina html, mas antes ele le o conteudo do html e mapeie todos os campos de entrada de dados e faça uma analise do que ira testar"`.
  2. Verificar o status da resposta e o corpo de texto retornado.
- **Resultado Esperado**:
  - Retorna HTTP 200 contendo código fonte executável em Java (`HtmlFormDynamicTester.java`).
  - Utiliza Selenium WebDriver e WebDriverManager (`io.github.bonigarcia:webdrivermanager`).
  - Implementa mapeamento de campos DOM (`driver.findElements(By.cssSelector("input, textarea, select"))`).
  - Realiza análise heurística dos campos de entrada (identificação de `email`, `password`, `text`, `submit`).
  - Elabora plano de teste e executa inserções sintéticas automatizadas com espera explícita (`WebDriverWait`).
  - Sugere título limpo e técnico `"Automação de Testes em Java com Selenium: Mapeamento de Campos e Análise de HTML"`, sem ecos de frases coloquiais ("Preciso de um codigo...").
  - Ausência de boilerplate enciclopédico irrelevante ("evolução histórica", "fatores científicos e sociais").
- **Status**: **PASSOU** (Automatizado via `08-ai-research.spec.ts`).

---

### TS-13: MFSTECH SOCIAL — Mídia Social, YouTube, Google Fotos e Comentários

#### TC-033: Acesso a `/social`, Identidade Visual e Contacto Oficial
- **Passos**:
  1. Aceder à rota `/social`.
  2. Verificar o título da página (`MFSTECH SOCIAL`).
  3. Validar a presença do logótipo, badge oficial e email de contacto `mfstechsocial@gmail.com`.
  4. Inspecionar o link direto para o canal do YouTube no cabeçalho com `target="_blank"`.
- **Resultado Esperado**: A página carrega com layout moderno, exibindo o branding oficial do MFSTECH SOCIAL e o e-mail de suporte institucional.
- **Status**: **PASSOU** (Automatizado via `11-social-media.spec.ts`).

#### TC-034: Execução de Vídeo do YouTube In-App e Botão Direto
- **Passos**:
  1. Localizar uma publicação com vídeo do YouTube no feed (`[data-testid='youtube-card']`).
  2. Inspecionar o elemento `<iframe>` embutido.
  3. Verificar o botão "Assistir no YouTube ↗" (`[data-testid='youtube-direct-link']`).
- **Resultado Esperado**: O vídeo pode ser reproduzido diretamente dentro da página através de iframe seguro (`youtube-nocookie.com/embed/`), e o botão externo direciona para a URL oficial no YouTube em nova aba.
- **Status**: **PASSOU** (Automatizado via `11-social-media.spec.ts`).

#### TC-035: Integração com Google Fotos e Botão de Redirecionamento
- **Passos**:
  1. Localizar um post com álbum ou imagem do Google Fotos (`[data-testid='google-photos-card']`).
  2. Verificar a renderização do card e o botão "Abrir no Google Fotos ↗".
- **Resultado Esperado**: Apresenta a pré-visualização da galeria com ligação direta para o álbum compartilhado no Google Fotos.
- **Status**: **PASSOU** (Automatizado via `11-social-media.spec.ts`).

#### TC-036: Envio e Renderização de Comentários em Tempo Real
- **Passos**:
  1. Em qualquer publicação do feed, localizar a seção de comentários.
  2. Digitar um comentário no campo de entrada de texto e clicar em "Comentar".
- **Resultado Esperado**: O comentário é gravado na base de dados Neon PostgreSQL via POST `/api/social/comments` e adicionado imediatamente à lista visível da publicação sem recarregar a página.
- **Status**: **PASSOU** (Automatizado via `11-social-media.spec.ts`).

#### TC-037: Publicação de Post com Detecção Automática de Link do YouTube
- **Passos**:
  1. Clicar no botão para abrir o modal de nova publicação (`#open-create-post-btn`).
  2. Preencher título, mensagem e colar uma URL do YouTube (`https://www.youtube.com/watch?v=...`).
  3. Verificar que o sistema detecta o link e exibe o badge indicador de vídeo.
  4. Clicar em "Publicar Agora".
- **Resultado Esperado**: A publicação é criada via POST `/api/social/posts`, o modal fecha e o novo post surge no topo do feed com o player do YouTube embutido e o botão de link externo.
- **Status**: **PASSOU** (Automatizado via `11-social-media.spec.ts`).

#### TC-038: Abertura da Máquina Fotográfica e Captura de Foto para Publicação
- **Passos**:
  1. Clicar no botão rápido de câmara `#quick-open-camera-btn` ou no botão `#modal-open-camera-btn`.
  2. Verificar abertura do modal `[data-testid='camera-capture-modal']` com viewfinder ao vivo e alternância de modos.
  3. Acionar a captura pelo obturador `[data-testid='take-photo-shutter-btn']`.
  4. Revisar a fotografia capturada e clicar em "Anexar Foto ao Post".
  5. Preencher a mensagem e submeter a publicação.
- **Resultado Esperado**: A fotografia é capturada e otimizada via canvas, anexada ao formulário e renderizada no feed dentro do card multimédia com suporte a visualização e ampliação em Lightbox.
- **Status**: **PASSOU** (Automatizado via `11-social-media.spec.ts`).

#### TC-039: Gravação de Vídeo em Tempo Real e Reprodução In-App
- **Passos**:
  1. Clicar em `#quick-record-video-btn` ou `#modal-record-video-btn`.
  2. Alternar para o modo vídeo e iniciar a gravação (`[data-testid='start-record-btn']`).
  3. Acompanhar o temporizador e o indicador `REC`, e clicar em parar gravação (`[data-testid='stop-record-btn']`).
  4. Revisar o vídeo com reprodutor integrado e clicar em "Anexar Vídeo ao Post".
  5. Submeter a publicação com o vídeo.
- **Resultado Esperado**: O vídeo é gravado em WebM/MP4, anexado ao post e publicado. O feed renderiza o `[data-testid='video-player-card']` com reprodutor HTML5 (`<video controls>`), botão de download e filtro de vídeos funcional.
- **Status**: **PASSOU** (Automatizado via `11-social-media.spec.ts`).




