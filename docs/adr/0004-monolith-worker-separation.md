# ADR 0004: Next.js Monolith + Standalone Background Worker

- **Status**: Accepted
- **Deciders**: Senior Full-Stack Architect
- **Date**: 2026-10-19

## Context & Problem Statement

We must balance developer velocity and cohesive type-safety with system resilience under long-running workloads (e.g., video transcoding, batch indexing).

## Considered Options

1. **Option 1: Complete Microservices (Next.js frontend + NestJS API + Worker service)**
   - High boilerplate, duplicated schemas, network hops between web and API for server-rendered pages.
2. **Option 2: Single All-in-One Process (Next.js server running BullMQ workers inside custom server)**
   - Next.js is optimized for ephemeral request-response lifecycles; long-running FFmpeg child processes inside the web process cause socket stalls, uncaught crashes, and memory leaks.
3. **Option 3: pnpm Monorepo with Next.js Monolith + Dedicated Worker Process (Selected)**
   - Next.js 15 App Router handles all web pages, server actions, REST API (`/api/v1/*`), and GraphQL (`/api/graphql`).
   - A dedicated Node.js service (`apps/worker`) handles BullMQ queues for FFmpeg and Meilisearch indexing.
   - Shared packages (`packages/db`, `packages/shared`) eliminate code duplication and maintain 100% end-to-end TypeScript safety.

## Decision Outcome

Selected **Option 3**:

- **Repo Structure**:
  - `apps/web`: Next.js 15 App Router (frontend + Route Handlers + GraphQL + Server Actions).
  - `apps/worker`: Node.js daemon (BullMQ consumers + FFmpeg + Sharp).
  - `packages/db`: Drizzle ORM schema, relations, core edit & transactional logic, migrations, seed scripts.
  - `packages/shared`: Storage client (S3/R2), search client (Meilisearch), queues, rate-limiter, markup parser.

This gives the maximum developer speed with complete runtime isolation between web traffic and heavy media encoding.
