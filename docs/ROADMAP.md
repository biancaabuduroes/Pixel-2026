# BunDeals – Roadmap

> Hackathon build: **5 hours total**, one developer working with Claude Code, plus one designer.
> Each phase ends with a short approval checkpoint. Nothing is committed or deployed without approval.

## Hackathon plan

| Time | Phase | Deliverables | Checkpoint |
|---|---|---|---|
| ✅ | Discovery | Rules, scope, architecture approved | Done |
| 0:00–0:20 | Documentation | `docs/`, README, CLAUDE.md | Docs reviewed; first commit approved |
| 0:20–0:45 | Project setup | Next.js, Tailwind, shadcn/ui, Prisma, Supabase connection, `.env.example`, `main` branch | App runs locally |
| 0:45–1:45 | **Business logic core** | Prisma schema; `domain/pricing`, `groups`, `wallet`, `ai` + Vitest tests; server services for join, cancel, settle, pickup, top-up | **All money tests pass** |
| 1:45–3:15 | Buyer flow | User switcher, product list/detail, group cards, join, my purchases, wallet | Buyer journey works end to end |
| 3:15–4:00 | Seller dashboard | Product + tier editor, groups overview, orders, pickup code, earnings, statistics card | Seller journey works |
| 4:00–4:30 | Demo panel + AI | Simulate buyers, close a group, expire deadlines, reset; forecast + template insights | Full demo script runs |
| 4:30–5:00 | Seed, deploy, rehearse | Demo data, Vercel + Supabase deploy, dry run, backup screen recording | Ready to present |

**Runs in parallel:** the designer shares Figma access; if it arrives before ~1:45, key screens are followed.

**Cut order if behind schedule:**
1. Seller statistics card.
2. Expire-deadline button.
3. Visual polish.

The buyer flow, wallet ledger, settlement and pickup are never cut.

## Main risks

| Risk | Mitigation |
|---|---|
| Time | Strict phase timeboxes; cut order above |
| Concurrency bugs in money logic | Logic core comes first, with tests |
| Figma arrives late | Token-based styling, switched over later |
| Live demo failure | Pre-loaded data, reset button, backup recording |

## After the hackathon (full MVP)

1. Figma connection and full gap analysis → align the UI.
2. Supabase Auth, scheduled job, notifications, disputes.
3. LLM insights (Claude Haiku 5.5), seller LLM summaries.
4. Stripe test mode; Sentry; Playwright; automatic PR checks.
5. **Legal and compliance review** before any real money (e-money, payment services, consumer protection, GDPR).
6. Digital euro research; P1/P2 items from FEATURES.md.
