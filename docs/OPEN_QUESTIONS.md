# BunDeals – Open Questions, Assumptions, Risks & Decisions

> Update this file whenever a decision is made or a question is answered.

## Decision log (approved)

| Date | Decision |
|---|---|
| 2026-11-07 | Parallel groups; seller-configured durations; one open group per duration; automatic renewal |
| 2026-11-07 | AI recommends groups (estimate) + "closest to unlocking" (exact); the buyer chooses |
| 2026-11-07 | Every unit gets the tier price; tiers fixed per product (sellers don't change prices) |
| 2026-11-07 | Quantity up to a per-buyer cap; **cap < first discount threshold** |
| 2026-11-07 | One active commitment per buyer per product |
| 2026-11-07 | Cancel allowed until the first lower tier unlocks, not after |
| 2026-11-07 | Money paid to the seller on pickup; no-show → seller paid after the deadline; disputes handled manually by an admin |
| 2026-11-07 | 6-digit pickup code typed in by the seller (not a voucher) |
| 2026-11-07 | Pickup code also shown as a QR: a link to the seller's confirm page with the code filled in, scanned with the phone camera (no in-app scanner); typing stays as the fallback. Adds the `qrcode` library |
| 2026-11-07 | In-app RON wallet; digital euro kept open (research) |
| 2026-11-07 | Simulated top-up through a PaymentProvider layer; Stripe test mode as P1 |
| 2026-11-07 | Demo control panel (demo environment only) + pre-loaded data |
| 2026-11-07 | AI package: forecast, recommendation, insight text, seller insights (P0); personalised discovery (P1); cross-seller combining (P2) |
| 2026-11-07 | Commission charged to the seller on completed sales |
| 2026-11-07 | One responsive web app: buyer mobile-first, seller desktop-first |
| 2026-11-07 | Tech stack (see TECH_STACK.md); data model and lifecycles (see DATA_MODEL.md) |
| 2026-11-07 | 5-hour hackathon cut: demo user switcher, demo-panel closing, template AI text, no disputes/notifications/uploads |
| 2026-11-07 | Build with token-based default styling if Figma access is not available in time |
| 2026-11-07 | Project setup: Next.js 16, shadcn/ui default `base-nova` style (Base UI), Prisma pinned to 7.10.1, Supabase key named `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| 2026-11-07 | AI forecast: pace = units joined per hour since the group opened (at least 1 hour counted); projected = pace × hours left; ratio = projected ÷ units missing to the next tier. **Likely ≥ 1.25, Possible ≥ 0.75, otherwise Unlikely.** No forecast at the top tier |
| 2026-11-07 | AI recommendation: probability per label (Likely 80%, Possible 50%, Unlikely 20%); expected unit price = p × next-tier price + (1 − p) × current price; lowest expected price first (an already-unlocked discount counts); ties → earlier closing |
| 2026-11-07 | Pickup deadline counts **calendar days**: `closesAt + pickupDeadlineDays × 24h` (UTC) |
| 2026-11-07 | Stock used = commitments that are not `CANCELLED` or `REFUNDED` (a refund gives the units back) |
| 2026-11-07 | Keep Prisma (not Supabase JS): it gives TypeScript transactions with row locks. Migrations run automatically on Vercel production deploys, guarded against the wrong Supabase project |
| 2026-11-07 | Claude sessions reach the Supabase database through the Management API (HTTPS) with a personal access token stored as an environment network secret. Verified: migration `20261107150000_init` applied by Vercel (checksum matches), 13 tables, 20 checks, 3 partial indexes, 4 ledger triggers active |
| 2026-11-07 | Onboarding (Figma "onboarding-flow"): whole app in **Romanian**; phone/SMS code **mocked**; "Continuă cu email" and "Am deja cont" go to a demo login (email + password for the 2 predefined users, `User.passwordHash`); answers saved in `User.preferences` (JSON); map/location **mocked**; **bunToken** = display name of the RON wallet (money stays integer bani, not decimal); top-up **minimum 10 RON**; home is a placeholder; **no dark mode**; Figma variables are the token source (no "Phase 2d") |
| 2026-11-07 | Login screen not in Figma: built from B1.2a's layout and components (approved). Budget slider steps: 50 RON weekly, 200 RON monthly. All demo visitors share the demo buyer account (**superseded below** for phone sign-ups) |
| 2026-11-07 | Onboarding UI adjustments: budget notify toggle removed; code-screen safety note removed; top-up replaced by Figma 64:1385 (typed amount, one row of presets, Brand "Cumpără bunToken", ⓘ opens the explainer sheet); **real map** (OpenStreetMap embed + Nominatim geocoder, no package, no API key; fake store pins removed) |
| 2026-11-07 | "Folosește locația mea" is hardcoded to Bulevardul Lascăr Catargiu 47, București (no browser location, no permission prompt) |
| 2026-11-07 | Buyer flow (Figma discover-flow 87:1000): tier thresholds stay in **units** (Figma's "persoane" copy becomes "unități"); the Pool page group selector maps open groups by closing time: shortest = "Rapid", longest = "Cel mai ieftin", middle = "Echilibrat", AI recommendation pre-selected; **Product.category** added (onboarding category list) for the Home chips; "Probabil plătești" = next tier price if the forecast is Likely, else the current price, always labelled as an estimate |
| 2026-11-07 | **Baskets** ("Coșuri de cumpărături"): a seller-defined basket is a Product of kind `BASKET` with its contents listed (`BasketItem`: name, quantity — display only). It has its own tiers, stock, groups, join, settlement and pickup like any product, so no money rule changes. Each Home category shows "Coșuri de cumpărături" then "Produse individuale". Baskets come from the demo seed for now; seller UI later. Search "Căutate recent" = last 3 products opened from search, stored in the browser only. In "Comenzile mele", orders "Gata de ridicare" come first |
| 2026-11-07 | **Bug fix:** onboarding top-ups went into the shared demo buyer, so Profile never showed the chosen amount. Now every phone sign-up creates its own buyer (generated email, no password, phone in preferences, empty wallet); "Am deja cont" still uses the shared demo buyer. A sign-up account can't log back in after logging out (no password; demo only) |
| 2026-11-07 | Database schema approved. Pickup code derived from a server secret + commitment ID; only its hash is stored. P1 tables (Dispute, Notification, AiInsight) added when those features are built |

## Assumptions (not explicitly confirmed)

- The default commission is 5%.
- The seller sets the pickup deadline per product; platform default 7 days.
- The committed price is the tier price shown *before* joining, even if the buyer's own quantity crosses a threshold.
- A buyer who joins a group that has already unlocked a tier can't cancel (follows from the cancellation rule; the UI warns them).
- Stock is reserved when a buyer joins; sold out → no new joins; the seller can't lower stock below the committed quantity.
- If no tier is unlocked, the purchase completes at the base price.
- Buyers can join until the group's closing time (server clock).
- Cancelling also ends at the group's closing time: "still open" (BL §5) means status `open` **and** `now < closesAt`, the same window as joining.
- The highest tier threshold must be ≤ stock.
- Splash (Figma 53:1330) has no specified timing: it opens the welcome slides after 1.5 s or on tap.
- Phone step (mock) accepts any 9-digit number typed as `712…`, `0712…` or `+40 712…`.
- Pickup code: single use; 5 wrong attempts → 15-minute lock; after the lock the count starts again from 0.
- A top-up is limited to 100,000 RON per request. This only protects the integer database column; it is not a business rule.
- Renewal stops when the product is inactive, the duration is removed, or stock is exhausted; open groups always settle.
- One pickup location per seller in the MVP.
- Seller payouts to a bank account are out of MVP scope.
- Buyer flow: with no scheduler yet, a buyer's groups that are past closing are settled when they open Home or Profile (`settleGroup`, idempotent). Pickup is available after the group closes; the Pool page shows "Ridici <day>, după <closing time>".
- Buyer flow: the Home list shows one card per product (its AI-recommended open group); the wallet history lists movements of the available balance; the order reference shown to buyers is `CL-` + the last 6 characters of the commitment id.
- Demo data: `prisma/seed-demo.sql` (generated by `prisma/demo-seed.mjs`) is temporary: 6 products, open groups, 30 simulated buyers, a 500 RON demo-buyer top-up, one ACTIVE group and one past-due group for the demo buyer.

## Open questions

- Top-up screen: Figma has no demo-money label, but BL §9 requires one. A one-line caption was added under the buttons ("Mod demo: banii sunt simulați…"). Keep it, or should the designer add it?
- Should the onboarding answers (local producers, categories, budget, radius) filter groups later? Today they are stored but unused.
- Top-up 64:1385 has no design for an amount under 10 RON: the caption turns into the red TextField error ("Suma minimă este 10 RON") and the button uses the Disabled style.
- Map: the "Rază X km" tag sits top-left (Figma: bottom-left) so OpenStreetMap's required attribution stays readable.

- When will Figma access be available, and which pages are final?
- Should a group show a minimum "closing soon" join cutoff (e.g. no joins in the last 5 minutes)?
- Target market and launch city for after the hackathon; seller acquisition strategy.
- Does the hackathon jury expect a specific digital currency integration (digital euro, stablecoin)?

## Risks

| Risk | Type | Notes |
|---|---|---|
| A wallet holding real funds may count as e-money / a payment service | Regulatory | **Needs specialist legal review** (EU e-money and payment services rules, BNR). The MVP uses simulated money only. |
| Card authorisation holds expire (~7 days) and clash with long groups | Payments | Relevant if card holds replace the wallet |
| Consumer protection (withdrawal rights for online purchases) vs. no cancelling after a tier unlocks | Regulatory | **Needs legal review** before launch |
| GDPR for buyer and seller data | Regulatory | Privacy policy and data retention needed before launch |
| Demand split across parallel groups | Business | Mitigated by recommendations |
| Concurrent joins / oversell / double charge | Technical | Transactions, row locks, unique operation IDs, tests |
| 5-hour build window | Delivery | Strict timeboxes and cut order |
| Figma not available in time | Delivery | Token-based styling |
| AI forecast with little real data | Product | Labelled as an estimate; realistic demo data |
| Seller doesn't hand over goods after being paid at the deadline | Operational | Dispute flow (P1) |
