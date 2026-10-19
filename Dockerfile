# syntax=docker/dockerfile:1.7
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# ---- Dependency layer (cached until a manifest changes) ----
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/web/package.json apps/web/
COPY apps/worker/package.json apps/worker/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile=false

# ---- Source + migrations/tools image ("migrate" one-shot job) ----
FROM deps AS tools
COPY . .
ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@wiki/db", "migrate"]

# ---- Next.js build ----
FROM tools AS build
ENV NODE_ENV=production
RUN pnpm --filter @wiki/web build

# ---- Web runtime (standalone output, ~150MB) ----
FROM node:22-bookworm-slim AS web
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN useradd -r -u 1001 app
COPY --from=build --chown=app /app/apps/web/.next/standalone ./
COPY --from=build --chown=app /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=app /app/apps/web/public ./apps/web/public
USER app
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]

# ---- Worker runtime (FFmpeg + sharp) ----
FROM tools AS worker
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app/apps/worker
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["pnpm", "start"]
