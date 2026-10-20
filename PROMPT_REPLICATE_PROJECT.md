# Master Specification & Prompt to Replicate MFSTECH-OpenPedia

> **How to use this prompt**: Copy and paste the entire text block below into an advanced agentic coding AI (or provide it to a senior engineering team). It contains every architectural specification, bug mitigation, database schema, i18n system, GDPR flow, search resilience strategy, and deployment configuration required to recreate this exact platform from scratch.

---

```markdown
You are tasked with building, configuring, branding, and deploying an enterprise-grade, highly resilient collaborative digital encyclopedia platform named "MFSTECH-OpenPedia". Follow this comprehensive specification meticulously.

### 1. High-Level Architecture & Tech Stack
1. **Monorepo Structure (pnpm workspaces)**:
   - Root `package.json` with workspace configuration (`pnpm-workspace.yaml`).
   - `apps/web`: Next.js 15 (App Router), React 19, Tailwind CSS v4, Auth.js (NextAuth v5 beta), Yoga GraphQL, REST API.
   - `apps/worker`: Node.js / BullMQ background processor with FFmpeg for multi-resolution video transcoding and image optimization.
   - `packages/db`: Drizzle ORM schemas, Neon PostgreSQL connection pooler client with SSL, migrations and seeds.
   - `packages/shared`: Shared utilities, AST Markdown/wikilink parser, S3 presigned URL client, rate limiter, and full-text search adapters.
   - `e2e`: Comprehensive Playwright test suite for cross-browser (Chromium, Firefox, WebKit, Mobile Chrome) validation.

2. **Database & Infrastructure**:
   - Primary Relational Database: Serverless Cloud PostgreSQL (Neon DB) with SSL enabled (`sslmode=require`).
   - Storage: S3-compatible object storage (MinIO for local development, AWS S3 / Cloudflare R2 for production) using presigned direct uploads.
   - Queue & Cache: Redis (BullMQ queues and rate limiting).
   - Search Engine: Dual-mode search engine supporting Meilisearch and seamless zero-downtime fallback to PostgreSQL ILIKE/full-text search.

---

### 2. Branding, UI/UX & Identity
1. **Name & Logo**:
   - Platform name: "MFSTECH-OpenPedia".
   - Official logo: Custom logo image placed at `/public/mfstech_logo.jpg` with subtle borders and rounded corners.
   - Header Brand: "MFSTECH" in accent color with a small hyphen separator and "OpenPedia" in serif typography.
   - Favicons and OpenGraph tags dynamically linked to `/mfstech_logo.jpg`.
2. **Design Tokens & Themes**:
   - Modern, editorial encyclopedia typography using `Inter` for clean sans-serif UI elements and `Source Serif 4` for article prose.
   - Flawless Dark/Light mode toggle persisted via cookie/script before hydration to prevent visual flash.

---

### 3. Core Functional Requirements
1. **Collaborative Article Lifecycle**:
   - Article reading with rich wikilinks `[[Target]]` or `[[Target|Label]]`, auto-detected categories `[[Category:Name]]`, and media embeds `[[File:name.jpg|thumb|Caption]]`.
   - Red links automatically highlighted when an internal link points to a non-existent page, routing directly to the creation editor.
   - Article editor with clean title input: when creating a new article (`/wiki/new/edit` or `/wiki/sandbox/edit`), the title input MUST start completely empty (never prefilled with "sandbox") and display placeholder "Título do artigo / Article title...".
   - Edit conflict detection using `baseRevisionId` to prevent simultaneous overwrites.
   - Revision history (`/wiki/[slug]/history`) with visual diff comparisons (`/wiki/[slug]/diff`), author attribution, timestamps, and one-click rollback.
   - Anti-vandalism filters: Block mass content blanking and link spam by anonymous users.

2. **Native Multi-Language Support (i18n)**:
   - 5 fully supported languages: Portuguese (PT - default), English (EN), Spanish (ES), French (FR), Italian (IT).
   - Dedicated interactive language selector in the sticky header with country flags and native names.
   - Cookie persistence (`NEXT_LOCALE`) and header detection for seamless SSR translation without route prefixes.

3. **Full GDPR / RGPD Compliance**:
   - Non-intrusive floating GDPR consent banner at the bottom of the viewport with localized legal text, "Accept All", "Essential Only", and "Privacy Policy" links.
   - Consent persisted across sessions in `localStorage` (`mfstech_gdpr_consent`) and HTTP cookies.
   - Dedicated `/privacy` page containing all 5 mandatory European legal sections (Data Controller, Data Processed, Legal Basis Art. 6 GDPR, Subject Rights, and Security Measures) translated across all 5 languages.
   - Registration form (`/register`) with an explicit, mandatory GDPR acceptance checkbox with a direct link to the Privacy Policy.

4. **Resilient Dual-Mode Search System**:
   - Header autocomplete (`/api/suggest`): debounced suggestions returning matching article titles, slugs, and snippets.
   - Full search page (`/search?q=...`): categorized tabs for "Articles" and "Images & videos".
   - **Critical Serverless Mitigation**: On serverless environments (like Vercel) where Meilisearch is not hosted locally, the application MUST automatically fall back to querying the PostgreSQL database directly via weighted matching (exact titles first, partial titles second, content snippets third) with `<mark>` highlight tags. Under no circumstances should the user see a "Search is temporarily unavailable" error.

5. **Authentication, User Profiles & RBAC**:
   - User account creation supporting usernames up to 100 characters (validated with Unicode regex `^[\p{L}\p{N} _.-]+$`).
   - Passwords hashed with salted bcrypt.
   - Role-Based Access Control: `user`, `admin`, `bureaucrat`.
   - Page protection levels (`none`, `semi`, `full`) allowing admins to protect high-profile pages.
   - Personal watchlist (`/watchlist`) and in-app notifications for article changes.

6. **Media Pipeline & Streaming**:
   - Direct-to-storage presigned uploads for images and videos up to 1GB.
   - Background transcoding producing adaptive resolutions (360p, 720p, 1080p MP4) and WebP responsive poster thumbnails.

---

### 4. Critical Serverless & Vercel Nuances
1. **ioredis Offline Queue Issue**:
   - `ioredis` defaults to `enableOfflineQueue: true`. On Vercel serverless without an active local Redis container, this causes server actions and registration to hang on "Please wait…".
   - **Fix**: In `packages/shared/src/ratelimit.ts` and `queues.ts`, initialize Redis with `enableOfflineQueue: false`, `connectTimeout: 500`, `maxRetriesPerRequest: 1`, and short-circuit rate limiting to `{ ok: true }` when running on Vercel without an explicit remote `REDIS_URL`.
2. **Next.js Framework Detection in Monorepos**:
   - Add `"next"` to root `package.json#devDependencies` so that the Vercel CLI automatically recognizes the Next.js framework in the root directory.
3. **Healthcheck Serverless Adaptability**:
   - In `/api/health`, ensure that if `REDIS_URL` is omitted on serverless deployments, the Redis check gracefully reports `true` so the endpoint returns HTTP 200 OK instead of HTTP 503 Service Unavailable.

---

### 5. Automated Playwright Test Suite
Create a dedicated `e2e/` folder with complete Playwright test coverage:
1. `01-homepage-and-branding.spec.ts`: Validates MFSTECH-OpenPedia logo, title, branding, hero, and action buttons.
2. `02-i18n-languages.spec.ts`: Validates switching across all 5 languages (PT, EN, ES, FR, IT) and text updates.
3. `03-gdpr-compliance.spec.ts`: Validates GDPR banner appearance, consent storage, privacy page, and registration checkbox.
4. `04-search-and-suggest.spec.ts`: Validates autocomplete and database search fallback without errors.
5. `05-article-read-and-edit.spec.ts`: Validates article rendering and empty title input on new article creation.
6. `06-auth-and-security.spec.ts`: Validates login, registration up to 100 characters, and form validation.
7. `07-api-endpoints.spec.ts`: Validates `/api/health`, `/api/suggest`, `/sitemap.xml`, and `/robots.txt`.

---

### 6. Verification and Deployment
1. Run `pnpm -r typecheck` to guarantee 100% type safety across all workspace packages.
2. Run `pnpm --filter @wiki/web build` to verify Next.js production build and page generation.
3. Run `pnpm test:e2e` to execute Playwright end-to-end tests.
4. Deploy to Vercel production with `npx vercel --prod --yes` and verify production alias.
```
