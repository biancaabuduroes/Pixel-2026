# BunDeals – Tech Stack & Architecture

> Approved 2026-11-07. Hackathon simplifications are marked **[H]**.

## 1. Overview

A single **Next.js + TypeScript** app containing both the UI and the server code, backed by **PostgreSQL (Supabase)** through **Prisma**, and deployed on **Vercel**. All pricing, wallet and lifecycle logic lives in plain TypeScript domain modules, tested with **Vitest**, and runs only on the server.

```
Browser (React UI) ──> Next.js server actions / API routes ──> domain logic ──> Prisma ──> PostgreSQL
                                                           └──> AI (forecast in code; LLM text later)
```

## 2. Decisions

| Area | Choice | Why | Alternative considered | Cost |
|---|---|---|---|---|
| Framework | Next.js (App Router) + TypeScript | One codebase for one developer; server-side business logic | Separate NestJS backend (≈2× setup) | Free |
| Styling | Tailwind CSS + shadcn/ui | Maps to Figma variables and Auto Layout; accessible components | CSS Modules | Free |
| Forms | React Hook Form + Zod | Same validation schema on client and server | Manual validation | Free |
| Data fetching | TanStack Query, refreshing every few seconds for group progress | Simple, reliable live updates | Supabase Realtime (P1) | Free |
| Database | PostgreSQL on Supabase | Transactions, row locks, constraints for financial integrity | MongoDB (rejected: weaker consistency) | Free tier |
| Database access | Prisma (raw SQL for row locks where needed) | Typed, beginner-friendly | Drizzle | Free |
| Authentication | **[H]** Demo user switcher; full MVP: Supabase Auth | Saves ~1h in the hackathon | Auth.js, Clerk | Free |
| File storage | **[H]** Pre-loaded images in `public/`; full MVP: Supabase Storage | — | S3 | Free |
| Scheduled jobs | **[H]** Demo panel; full MVP: Supabase Cron calling a secured endpoint every minute | Idempotent close, renew and deadline jobs | Inngest, Trigger.dev | Free |
| AI | Forecast in TypeScript; insight text from templates **[H]**, then Claude Haiku 5.5 (`claude-haiku-5-5`) with caching | Cheap, explainable, with a fallback | Other LLM providers | A few € |
| Payments | `PaymentProvider` interface → `SimulatedProvider` **[H]**; Stripe test mode (P1) | Swappable without changing the wallet logic | — | Free |
| Hosting | Vercel + Supabase | Deploys from GitHub, preview links | Railway, Render | Free (Vercel Hobby is non-commercial; a real launch needs Pro, about $20/month) |
| Monitoring | Sentry (P1) | Error reporting | Logs only | Free tier |
| Testing | Vitest (domain logic) **[H]**; Playwright end-to-end (P1) | Money logic tested independently of the UI | Jest | Free |

## 3. Project structure

```
pixel-app/
├── docs/                    # Product and technical documentation (this folder)
├── prisma/
│   ├── schema.prisma        # Database schema (see DATA_MODEL.md)
│   └── seed.ts              # Demo data: users, products, groups, join history
├── public/                  # Static assets, product images
├── src/
│   ├── app/                 # Next.js routes (pages + API)
│   │   ├── (buyer)/         # Buyer screens: home, product, purchases, wallet
│   │   ├── seller/          # Seller dashboard: products, groups, orders
│   │   ├── admin/demo/      # Demo control panel (DEMO_MODE only)
│   │   └── api/             # Route handlers (e.g. future cron endpoint)
│   ├── domain/              # Pure business logic — no UI, no database; fully unit-tested
│   │   ├── pricing/         # Tier validation, tierPrice, savings
│   │   ├── groups/          # Lifecycle rules, renewal, cancellation eligibility
│   │   ├── wallet/          # Ledger posting rules, balance calculation, commission
│   │   └── ai/              # Forecast, recommendation ranking, insight templates
│   ├── server/              # Database-backed services (transactions, locking) used by actions
│   │   ├── actions/         # Next.js server actions (join, cancel, top-up, confirm pickup…)
│   │   └── payments/        # PaymentProvider interface + SimulatedProvider
│   ├── components/
│   │   ├── ui/              # shadcn/ui primitives, styled from Figma tokens
│   │   ├── buyer/           # TierLadder, GroupCard, GroupProgress, WalletSummary…
│   │   └── seller/          # TierEditor, OrderList, PickupCodeForm…
│   ├── lib/                 # Prisma client, money formatting, auth/session helpers
│   └── styles/              # Global CSS + design tokens
├── tests/                   # Cross-module and integration tests (domain tests sit next to their code)
├── CLAUDE.md
└── README.md
```

**Rule:** `src/domain` never imports from `src/server`, `src/app` or Prisma. That keeps the financial rules testable on their own.

## 4. Security & integrity

- Prices, totals, balances and eligibility are **always calculated on the server**. Client input is limited to IDs and quantities, validated with Zod.
- Every server action checks the user's role and ownership (a seller can only touch their own products and orders).
- Joining, cancelling, settling and pickup each run in **one database transaction with row locks**.
- Ledger operations use unique operation IDs (no duplicate charges).
- Pickup codes are stored hashed; failed attempts are rate-limited.
- Secrets live only in `.env.local` (git-ignored) and in Vercel/Supabase environment settings. A `.env.example` lists variable names without values.
- `DEMO_MODE` gates the demo panel and the user switcher. **Never enable it in production.**
- **The simulated wallet is not a financial product.** Real money requires legal review (e-money / payment services rules, BNR) and a licensed partner. This document does not give legal advice.

## 5. Environments

| Environment | Purpose | Database |
|---|---|---|
| Local | Development | Supabase project (dev) or local Postgres |
| Demo (Vercel) | Hackathon presentation, `DEMO_MODE=true` | Supabase project (demo) |
| Production | Future — not part of the hackathon | Separate project, `DEMO_MODE` off |

## 6. Environment variables (names only)

`DATABASE_URL`, `DIRECT_URL`, `DEMO_MODE`, `ANTHROPIC_API_KEY` (optional, for the LLM insight text), later `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `CRON_SECRET`.
