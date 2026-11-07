# CLAUDE.md – BunDeals

## Context
- Hackathon project (Pixel 2026, AI + Digital Currency). 5-hour build; scope in `docs/ROADMAP.md`.
- The developer is learning: explain important technical decisions clearly and briefly.
- Read `docs/BUSINESS_LOGIC.md` **before** touching pricing, groups, wallet or settlement code. If code and docs disagree, stop and ask.

## Approval rules
- Never commit, push, deploy, install new dependencies outside the approved stack, or change the database schema without explicit approval.
- Don't invent business rules. When a rule is missing, ask, then record the answer in `docs/OPEN_QUESTIONS.md`.
- Out of scope unless approved: delivery, vouchers, real money. QR codes only for the approved pickup QR (BUSINESS_LOGIC.md §8).

## Money & integrity (non-negotiable)
- Money is always an integer number of **bani**. No floats.
- Prices, totals, balances and permissions are calculated **only on the server**. Client input = IDs + quantities, validated with Zod.
- Join, cancel, settle and pickup run in one database transaction with row locks.
- Ledger entries are append-only; each transaction has a unique `operationId` and its entries add up to 0. Balances are calculated, never stored.
- Settlement must assert `finalUnitPrice <= committedUnitPrice`.
- AI output never feeds into prices, settlement or the wallet.

## Code conventions
- `src/domain/*` = pure TypeScript business logic with Vitest tests next to it; no imports from Prisma, `src/server` or `src/app`.
- `src/server/*` = database-backed services and server actions.
- UI: Tailwind + shadcn/ui; colours, spacing and type only through design tokens (Figma is the visual reference; don't redesign without asking).
- Demo-only features are gated by `DEMO_MODE`.
- Secrets only in `.env.local` / hosting settings; keep `.env.example` updated with names only.

## Workflow
- Branches `feat/…`, `fix/…`, `docs/…`; commit prefixes `feat: fix: docs: test: chore:`.
- Update the matching `docs/` file in the same change as the code.
- Run the tests before saying something is done, and report failures honestly.
