# ADR 0003: Full-Text Search Engine Selection

- **Status**: Accepted
- **Deciders**: Senior Full-Stack Architect
- **Date**: 2026-10-19

## Context & Problem Statement

An encyclopedia platform requires instant search-as-you-type autocomplete, tolerant typo matching, category filtering, and media search across tens of thousands of articles and assets.

## Considered Options

1. **Option 1: PostgreSQL Full-Text Search (`tsvector` + `pg_trgm`)**
   - *Pros*: No external search daemon needed.
   - *Cons*: High latency on prefix autocomplete with millions of trigrams; complex typo-tolerance configuration; adds significant query load to the primary OLTP database.
2. **Option 2: Elasticsearch / OpenSearch**
   - *Pros*: Highly scalable across distributed clusters.
   - *Cons*: High memory footprint (requires minimum 2–4 GB JVM heap idle), complex index management, steep operational overhead.
3. **Option 3: Meilisearch (Selected)**
   - *Pros*: Sub-50ms search latency out-of-the-box, lightweight Rust binary (~100MB RAM), native typo tolerance, instant prefix search/autocomplete, simple REST API, built-in highlighting and cropping.
   - *Cons*: Single-node primary architecture (sufficient for up to ~10 million documents before sharding is required).

## Decision Outcome

Selected **Option 3 (Meilisearch)**.

Articles and media are synchronized asynchronously via BullMQ search workers whenever an edit is saved or a media rendition completes. Search indexing never delays HTTP responses to editors.
Search index failures fail open or re-queue without disrupting primary article persistence.
A dedicated CLI script (`pnpm --filter @wiki/worker reindex`) can rebuild the full search index from PostgreSQL at any time.
