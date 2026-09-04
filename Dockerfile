# syntax=docker/dockerfile:1

# ---- deps -------------------------------------------------------------
# Installs dependencies in their own stage so they're cached independently
# of application code changes.
FROM node:24-slim AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- build --------------------------------------------------------------
FROM node:24-slim AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `next build` parses lib/config/env.ts while collecting page data, so it
# needs *some* valid configuration to build against — Next.js loads `.env`
# automatically. These placeholder values aren't baked into the output;
# they're only read at build time. The running container reads its own
# environment at startup instead.
RUN cp .env.example .env && \
    sed -i 's/^WOOVI_APP_ID=.*/WOOVI_APP_ID="build-placeholder"/' .env && \
    sed -i 's/^APOIA_ADMIN_SECRET=.*/APOIA_ADMIN_SECRET="build-placeholder-needs-32-chars-min"/' .env
RUN pnpm build
RUN pnpm db:migrate:build
RUN rm .env

# ---- runtime --------------------------------------------------------------
FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN groupadd --system --gid 1001 apoia && \
    useradd --system --uid 1001 --gid apoia apoia && \
    mkdir -p /data && chown apoia:apoia /data

# `output: standalone` traces only the files actually needed at runtime,
# including a pruned node_modules (better-sqlite3's native binding among
# them, since it's listed in serverExternalPackages).
COPY --from=build --chown=apoia:apoia /app/.next/standalone ./
COPY --from=build --chown=apoia:apoia /app/.next/static ./.next/static
COPY --from=build --chown=apoia:apoia /app/drizzle ./drizzle
COPY --from=build --chown=apoia:apoia /app/dist-migrate/migrate.cjs ./migrate.cjs
COPY --chown=apoia:apoia docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Next's tracer places better-sqlite3 under node_modules/.pnpm and only
# wires up relative requires for its own bundled server code — there's no
# top-level `node_modules/better-sqlite3`. migrate.cjs runs standalone (it's
# not part of Next's build graph) and does a plain `require("better-sqlite3")`,
# so it needs that top-level entry point too.
RUN cd node_modules && \
    target=$(find .pnpm -maxdepth 1 -iname 'better-sqlite3@*' | head -n1) && \
    ln -s "${target}/node_modules/better-sqlite3" better-sqlite3 && \
    chown -h apoia:apoia better-sqlite3

USER apoia
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0 DATABASE_PATH=/data/apoia.db

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
