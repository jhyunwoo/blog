# Cloudflare Tech Blog

High-performance technical blog scaffold for Cloudflare Workers.

## Stack

- `web/`: Next.js App Router, React, Tailwind CSS v4, deployed with `@opennextjs/cloudflare`.
- `api/`: Hono.js Worker, Drizzle ORM, Cloudflare D1, Cloudflare R2.
- `packages/shared/`: shared Zod schemas and TypeScript types.

## Local Setup

```bash
pnpm install
pnpm --filter api db:generate
pnpm --filter api db:apply:local
pnpm dev
```

Create Cloudflare resources before deploying:

```bash
pnpm --filter api wrangler d1 create tech-blog-db
pnpm --filter api wrangler r2 bucket create tech-blog-media
```

Then copy the generated D1 database id into `api/wrangler.jsonc` and `web/wrangler.jsonc`.

## Admin Password

The API expects `ADMIN_PASSWORD_HASH` to be a bcrypt hash.

```bash
pnpm --filter api hash-password "your-strong-password"
```

## Deploy

```bash
pnpm --filter api deploy
pnpm --filter web deploy
```

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter api deploy:dry
pnpm --filter web build:worker
```
