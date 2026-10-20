# MFSTECH-OpenPedia — Documentação Técnica e Funcional

## 1. Visão Geral do Projeto

**MFSTECH-OpenPedia** é uma plataforma moderna, colaborativa e resiliente de enciclopédia digital livre inspirada nos princípios da Wikipédia, mas construída sobre as tecnologias mais avançadas da web contemporânea. A plataforma permite a leitura, criação, edição colaborativa, versionamento contínuo de artigos com rastreamento granular de alterações (diffs), suporte a multimédia com transcodificação automática de vídeo em múltiplas resoluções via FFmpeg, pesquisa em tempo real com fallback direto para banco de dados relacional e conformidade rigorosa com a legislação europeia de proteção de dados (**RGPD / GDPR**).

### Principais Diferenciais:
- **Internacionalização Nativa (i18n)**: Suporte fluido e reativo a 5 idiomas (**Português, Inglês, Espanhol, Francês e Italiano**), com persistência de preferências do utilizador por cookies seguros e cabeçalhos HTTP.
- **Conformidade RGPD Completa**: Consentimento explícito de cookies/privacidade com persistência local, página detalhada de política de privacidade e aceitação legal obrigatória no registo de utilizadores.
- **Motor de Pesquisa Resiliente**: Arquitetura híbrida que utiliza **Meilisearch** quando configurado e comutação instantânea (*zero-downtime fallback*) para **Neon PostgreSQL** com busca por texto, títulos e relevância ponderada.
- **Editor Wiki Sem Atrito**: Criação de artigos limpa, sem pré-preenchimentos indesejados (*sandbox free*), com renderização em tempo real de Markdown, wikilinks (`[[Artigo]]`), categorias e ficheiros.
- **Autenticação e Moderação Granular (RBAC)**: Controlo de acessos baseado em perfis (*user*, *admin*, *bureaucrat*), proteção de páginas contra vandalismo, proteções semi e completas, e limites de taxa (*rate limiting*).
- **Publicação Serverless de Alto Desempenho**: Hospedagem global na **Vercel** acoplada ao banco serverless **Neon PostgreSQL** em Frankfurt (`eu-central-1`), garantindo baixa latência e alta disponibilidade.

---

## 2. Arquitetura do Sistema

O projeto é estruturado como um monorepo modular gerenciado com **pnpm workspaces**:

```
NewProject/
├── apps/
│   ├── web/                    # Aplicação Next.js 15 (App Router, React 19, Tailwind CSS)
│   └── worker/                 # Worker assíncrono BullMQ (transcoding FFmpeg, indexação de busca)
├── packages/
│   ├── db/                     # Camada de banco de dados (Drizzle ORM, PostgreSQL/Neon, esquemas e migrações)
│   └── shared/                 # Utilitários compartilhados, parser de Markdown/AST, validação Zod, S3 e rate limit
├── e2e/                        # Suite de testes ponta a ponta com Playwright
├── docker-compose.yml          # Ambiente de infraestrutura local (PostgreSQL, Redis, Meilisearch, MinIO)
├── playwright.config.ts        # Configuração do Playwright para múltiplos navegadores e mobile
├── DOCUMENTATION.md            # Documentação técnica e funcional completa
├── TEST_PLAN.md                # Plano de testes formal com cenários e casos de teste
└── package.json                # Gerenciador raiz do monorepo
```

### Tecnologias Utilizadas:
| Camada | Tecnologia | Propósito |
|---|---|---|
| **Frontend Web** | Next.js 15.1.3 + React 19 | SSR, Server Components, Server Actions e páginas dinâmicas |
| **Estilização** | Tailwind CSS v4 | Design system com tema claro/escuro nativo |
| **Banco de Dados** | Neon Cloud PostgreSQL (v16) | Armazenamento relacional com pooler e SSL |
| **ORM** | Drizzle ORM | Consultas tipadas, migrações determinísticas e joins otimizados |
| **Autenticação** | Auth.js (NextAuth v5 beta) | Sessões seguras JWT, hashing bcrypt e proteção CSRF |
| **Armazenamento de Ficheiros**| S3 / MinIO / AWS SDK v3 | Uploads diretos pré-assinados e entrega de multimédia |
| **Fila Assíncrona** | BullMQ + Redis | Processamento de transcodificação de vídeos e miniaturas |
| **Transcoding de Vídeo** | FFmpeg | Gera rendições 360p, 720p, 1080p e posters WebP |
| **Pesquisa** | PostgreSQL ILIKE + Meilisearch | Motor de busca com destaque de termos e relevância |
| **Testes Automatizados** | Playwright Test | Validação E2E em Chromium, Firefox, WebKit e Mobile |

---

## 3. Módulos e Funcionalidades Detalhadas

### 3.1. Gestão e Leitura de Artigos (`apps/web/src/app/wiki/[slug]`)
- **Wikilinks e Transclusões**: O parser transforma automaticamente `[[Título]]` ou `[[Título|Texto Alternativo]]` em links internos. Links para páginas inexistentes são destacados visualmente (*red links*) direcionando para a criação.
- **Categorização Automática**: Sintaxe `[[Category:Nome]]` associa o artigo a taxonomias navegáveis em `/category/[slug]`.
- **Incorporação de Multimédia**: Sintaxe `[[File:imagem.jpg|thumb|Legenda]]` renderiza imagens e vídeos hospedados com legendas e ampliação em modal.
- **Artigo em Destaque**: Artigos marcados como destaque pelos moderadores aparecem na página inicial.
- **Artigo Aleatório**: Rota `/wiki/random` seleciona um artigo aleatório do namespace principal.

### 3.2. Edição Colaborativa e Versionamento (`/wiki/[slug]/edit` & `/history`)
- **Detecção de Conflitos de Edição**: Cada edição armazena o `baseRevisionId`. Se dois editores gravarem em simultâneo, o sistema alerta sobre o conflito sem sobrescrever cegamente o trabalho alheio.
- **Histórico Completo e Diffs**: Cada salvamento gera uma nova linha na tabela `revisions`. A página `/history` lista todas as versões com autor, data, tamanho e sumário. A página `/diff` compara visualmente as linhas adicionadas e removidas.
- **Reversão Rápida (*Rollback*)**: Administradores e utilizadores podem reverter um artigo para qualquer estado histórico com um clique.
- **Filtro Anti-Vandalismo**: Bloqueia esvaziamento em massa (*blanking*) e inserção massiva de hiperligações externas por utilizadores anónimos.

### 3.3. Sistema de Internacionalização (i18n)
- **5 Idiomas Suportados**: Português (`pt`), Inglês (`en`), Espanhol (`es`), Francês (`fr`), Italiano (`it`).
- **Seletor no Cabeçalho**: Componente reativo no topo da página permite trocar de língua instantaneamente.
- **Persistência**: Grava a preferência em cookie seguro (`NEXT_LOCALE`), mantendo a escolha do utilizador em todas as navegações futuras.

### 3.4. Conformidade RGPD / GDPR
- **Banner de Consentimento Flutuante**: Apresenta opções claras ("Aceitar Todos", "Apenas Necessários", "Política de Privacidade") na primeira visita.
- **Página de Política de Privacidade (`/privacy`)**: Informações jurídicas em 5 idiomas discriminando o responsável pelo tratamento, finalidades, base legal (Art. 6.º do RGPD), direitos dos titulares (acesso, retificação, eliminação) e práticas de segurança.
- **Consentimento no Registo**: Checkbox obrigatória no formulário de criação de conta (`/register`) garantindo aceitação expressa dos termos.

### 3.5. Sistema de Pesquisa Híbrida (`/search` e `/api/suggest`)
- **Caixa de Sugestões Rápida**: Ao digitar a partir de 2 caracteres no cabeçalho, a rota `/api/suggest` retorna sugestões instantâneas com trecho do artigo.
- **Fallback Automático Neon PostgreSQL**: Se o cluster Meilisearch estiver indisponível ou inacessível, o sistema executa a consulta via SQL com ordenação inteligente (títulos exatos primeiro, correspondências parciais depois) e destaque em `<mark>`.

### 3.6. Gestão Multimédia e Transcoding (`/upload` e Worker)
- **Upload Direto Pré-Assinado**: O cliente requisita uma URL pré-assinada (`/api/media/presign`) e envia o ficheiro diretamente ao S3/MinIO, descarregando o servidor web.
- **Worker FFmpeg**: Fila BullMQ processa vídeos e imagens gerando:
  - Miniaturas WebP (`thumb-400`, `webp-800`, `webp-1600`);
  - Vídeos H.264/AAC otimizados para streaming web (`360p`, `720p`, `1080p`).

### 3.7. APIs Abertas (REST e GraphQL)
- **GraphQL (`/api/graphql`)**: Endpoint acionado por Yoga GraphQL para consultar artigos, revisões, multimédia e pesquisas com tipagem forte.
- **REST API (`/api/v1/articles`)**: Endpoint RESTful para consumo programático por terceiros.
- **Healthcheck (`/api/health`)**: Monitorização de prontidão e vitalidade da base de dados e infraestrutura.

---

## 4. Esquema de Banco de Dados (Drizzle ORM)

O banco de dados relacional é normalizado e inclui:
- `users`: ID, nome (até 100 caracteres), email, password hash, papel (*role*), contagem de edições, data de criação, bloqueios.
- `articles`: ID, namespace (`main`, `talk`, `category`), título, slug, revisão atual, proteção, destaque.
- `revisions`: ID, ID do artigo, ID do autor (ou hash do IP se anónimo), conteúdo Markdown, sumário, tamanho, flags.
- `categories` & `article_categories`: Estrutura hierárquica de categorização com chave estrangeira em cascata.
- `page_links`: Mapeamento de links internos para resolução de redirects e ligações afluentes (*what links here*).
- `media` & `media_renditions`: Metadados de ficheiros enviados, licença, status de processamento e rendições transcodificadas.
- `watchlist`: Artigos favoritos seguidos por cada utilizador.
- `notifications`: Alertas sobre edições em páginas vigiadas e mensagens de discussão.

---

## 5. Instruções de Execução e Deploy

### 5.1. Execução Local
```bash
# 1. Instalar dependências
pnpm install

# 2. Iniciar serviços auxiliares Docker
pnpm infra:up

# 3. Executar migrações e seed inicial
pnpm db:migrate
pnpm db:seed

# 4. Iniciar servidores de desenvolvimento
pnpm dev
```

### 5.2. Testes Automatizados E2E
```bash
# Executar todos os testes Playwright
pnpm test:e2e

# Executar com interface gráfica interativa
pnpm test:e2e:ui
```

### 5.3. Publicação em Produção (Vercel)
O projeto está configurado para deploy contínuo na Vercel:
```bash
npx vercel --prod --yes
```
Variáveis de ambiente requeridas no Vercel:
- `DATABASE_URL`: String de conexão Neon PostgreSQL com `?sslmode=require`.
- `SITE_NAME`: "MFSTECH-OpenPedia"
- `AUTH_SECRET`: Chave secreta aleatória de 32 bytes para assinatura de tokens de sessão.
- `AUTH_TRUST_HOST`: "true"
