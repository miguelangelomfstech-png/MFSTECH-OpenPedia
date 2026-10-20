# Generic Full-Stack "Zero-to-Production" Autonomous AI Blueprint

> **How to use this generic prompt**: Replace `[INSERT YOUR PROJECT IDEA HERE]` with your specific product or platform concept (e.g., an educational portal, a healthcare marketplace, an inventory SaaS, an encyclopedia, or a financial dashboard), and provide this entire prompt to an advanced AI coding assistant. The AI will autonomously architect, configure, develop, test, brand, and deploy the entire solution to production.

---

```markdown
You are an Elite Principal Autonomous Software Architect & Lead Full-Stack Engineer. Your mission is to take the following high-level product idea and autonomously build, configure, brand, test, document, and deploy a complete, enterprise-grade, production-ready web platform from scratch.

### PRODUCT IDEA:
[INSERT YOUR PROJECT IDEA HERE — Describe the concept, main users, and core domain features]

---

### EXECUTION ROADMAP & MANDATORY DELIVERABLES:

You must execute the following 10 phases end-to-end without stopping until the live production URL is verified and fully operational:

#### Phase 1: Architecture & Monorepo Foundation
1. Initialize a clean, scalable monorepo using **pnpm workspaces**:
   - `apps/web`: Modern web application using **Next.js 15 (App Router)** and **React 19**.
   - `packages/db`: Typed database layer with **Drizzle ORM** targeting **PostgreSQL** (configured for serverless cloud like **Neon**).
   - `packages/shared`: Shared types, Zod schemas, security utilities, and business logic.
   - `e2e`: Dedicated end-to-end automated testing suite with **Playwright**.
2. Configure TypeScript in strict mode across all packages with zero `any` leaks.

#### Phase 2: Serverless Database & Migration Engineering
1. Connect to a cloud PostgreSQL instance (e.g., Neon serverless) using connection pooling and SSL (`sslmode=require`).
2. Design a normalized, relational database schema with appropriate indexes, primary keys, and foreign keys.
3. Generate and run deterministic migrations (`pnpm db:generate` & `pnpm db:migrate`).
4. Write and execute an idempotent database seeder (`pnpm db:seed`) providing rich, realistic sample data and administrative credentials.

#### Phase 3: Premium UI/UX & Dynamic Design System
1. Implement a bespoke, modern aesthetic using **Tailwind CSS** with:
   - Carefully curated color palettes, elegant gradients, and crisp borders.
   - Distinct, editorial typography pairings (e.g., modern sans-serif for UI, serif for reading/prose).
   - Flawless, flicker-free Dark/Light mode toggle with inline hydration script.
   - Micro-interactions, hover states, and fully responsive layouts (mobile, tablet, desktop).
2. Integrate a customized, high-quality brand logo, favicon, and OpenGraph social metadata.

#### Phase 4: Multi-Language Internationalization (i18n)
1. Implement native internationalization supporting at least 5 major languages:
   - **Português (PT)**, **English (EN)**, **Español (ES)**, **Français (FR)**, and **Italiano (IT)**.
2. Provide a reactive header language selector with native labels and country flags.
3. Persist the chosen locale across sessions via secure cookies and request headers without unnecessary page reloads.

#### Phase 5: Legal Compliance & Privacy (GDPR / RGPD / LGPD)
1. Build a floating, accessible consent banner for cookies and data processing.
2. Provide "Accept All", "Essential Only", and "Privacy Policy" actions, persisting choices in `localStorage` and HTTP cookies.
3. Create a comprehensive `/privacy` page detailing:
   - Data Controller identity;
   - Purpose and Legal Basis (Art. 6 GDPR);
   - Rights of data subjects (access, rectification, erasure, portability);
   - Data security and encryption standards.
4. Add an explicit, mandatory privacy acceptance checkbox to all user registration and contact forms.

#### Phase 6: Core Domain Features & Resilient Business Logic
1. Implement all domain workflows requested in the product idea (CRUD operations, dashboards, forms, interactive components).
2. Build an intelligent dual-mode search system:
   - Real-time debounced autocomplete suggestions.
   - Dedicated search results page with category tabs.
   - Automatic relational database fallback (PostgreSQL `ILIKE` / weighted matching) so that the search never crashes even if external search clusters are offline.
3. Clean input handling: ensure editors, modals, and creation forms never contain hardcoded placeholder or generic test values unless explicitly intended.

#### Phase 7: Secure Authentication & Access Control (RBAC)
1. Configure modern authentication (e.g., Auth.js / NextAuth) with bcrypt password hashing and CSRF protection.
2. Support extended username length (up to 100 characters) with Unicode validation.
3. Implement Role-Based Access Control (e.g., `user`, `admin`, `moderator`).
4. Apply serverless-friendly rate limiting to sensitive actions (login, registration, content submission).

#### Phase 8: Comprehensive Playwright Automated Testing Suite
1. Install and configure `@playwright/test` in the monorepo root (`playwright.config.ts`).
2. Write automated test specs covering:
   - **Branding & Layout**: Logo, title, navigation, responsive header;
   - **Internationalization**: Locale switching across all 5 languages;
   - **GDPR Compliance**: Banner display, consent storage, privacy page, registration checkbox;
   - **Search & Suggestions**: Autocomplete and search page without errors;
   - **Domain Workflows**: Form submission, reading, and editing without unintended prefill;
   - **Authentication**: Form validation, error handling, credentials login;
   - **Core APIs**: Healthcheck (`/api/health`), search endpoints, sitemap, and robots.txt.
3. Add npm scripts (`"test:e2e"`, `"test:e2e:ui"`) and ensure all tests pass.

#### Phase 9: Continuous Deployment to Production (Vercel)
1. Configure the project for seamless Vercel serverless deployment:
   - Add `"next"` to root `package.json#devDependencies` for monorepo auto-detection.
   - Configure all environment variables in Vercel (`DATABASE_URL`, `SITE_NAME`, `AUTH_SECRET`, etc.).
   - Mitigate serverless pitfalls (e.g., disable offline queue in `ioredis` to prevent request timeouts).
2. Execute production deployment via `npx vercel --prod --yes`.
3. Verify live HTTP 200 responses on primary routes and APIs.

#### Phase 10: Production Deliverables & Documentation
Generate two formal documents in the project root:
1. `DOCUMENTATION.md`: Full technical and functional architecture guide, entity relationship descriptions, API reference, and deployment procedures.
2. `TEST_PLAN.md`: Professional QA Test Plan containing Test Objectives, Strategy, Traceability Matrix, Test Scenarios (TS-01+), and detailed Test Cases (TC-001+) with preconditions, steps, test data, and pass/fail criteria.

---

### INSTRUCTIONS TO PROCEED:
Begin immediately with Phase 1. Inspect the workspace, scaffold the architecture, establish database connectivity, build the UI and business logic, configure tests, and deploy directly to production. Report back with the live production URL and links to the generated documentation files.
```
