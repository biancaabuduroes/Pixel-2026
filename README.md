# BunDeals

**Buy together, pay less.** BunDeals is an AI-powered collective buying platform built for the Pixel 2026 Hackathon (AI + Digital Currency).

Sellers publish products with quantity-based price tiers. Buyers join time-limited purchasing groups and reserve the current price in an in-app RON wallet. If the group reaches a higher tier, every unit gets the lower price, and buyers never pay more than they committed to. AI estimates which group is most likely to unlock a discount; seller-defined rules alone decide the price. Buyers collect their products from the seller with a 6-digit pickup code.

> ⚠️ Hackathon prototype. The wallet uses **simulated money** and isn't a regulated financial product.

## Tech overview

Next.js + TypeScript · Tailwind CSS + shadcn/ui · PostgreSQL (Supabase) + Prisma · Vitest · Vercel. See [docs/TECH_STACK.md](docs/TECH_STACK.md).

## Documentation

| File | Contents |
|---|---|
| [docs/APP_PLAN.md](docs/APP_PLAN.md) | Product, business model, rules, MVP scope, demo script |
| [docs/BUSINESS_LOGIC.md](docs/BUSINESS_LOGIC.md) | Pricing, groups, wallet ledger, settlement — **source of truth** |
| [docs/FEATURES.md](docs/FEATURES.md) | Feature catalogue and priorities |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | Entities, constraints, integrity rules |
| [docs/TECH_STACK.md](docs/TECH_STACK.md) | Architecture, structure, security |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Figma connection and component map |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phases and checkpoints |
| [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md) | Decisions, assumptions, risks |

## Setup

Requirements: **Node.js 22+** and npm.

```bash
npm install
cp .env.example .env.local   # fill in the values; never commit this file
npm run dev                  # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate Next.js route types, then run the TypeScript compiler |
| `npm test` | Run the Vitest tests once (`npm run test:watch` to keep watching) |

The environment variables are listed in [`.env.example`](.env.example) (names only) and explained in [docs/TECH_STACK.md](docs/TECH_STACK.md#6-environment-variables-names-only).

**Database:** `npm install` also generates the Prisma client (`src/generated/prisma`). Apply the migrations to the database in `DIRECT_URL` with:

```bash
npx prisma migrate deploy
```

Schema: `prisma/schema.prisma`. Extra database rules (checks, append-only ledger triggers) are in the migration SQL; see [docs/DATA_MODEL.md](docs/DATA_MODEL.md#enforced-by-the-database).

**Adding UI components:** `npx shadcn@latest add <component>` (configuration in `components.json`; design tokens in `src/styles/globals.css`).

## Development workflow

- `main` is always ready to demo; work happens on `feat/…` / `fix/…` branches merged through pull requests.
- Commit prefixes: `feat:`, `fix:`, `docs:`, `test:`, `chore:`.
- Business-logic changes include tests and an update to `docs/BUSINESS_LOGIC.md`.
- Pull requests are reviewed (`/code-review` in Claude Code) before merging.
