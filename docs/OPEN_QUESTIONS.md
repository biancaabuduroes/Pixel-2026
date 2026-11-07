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
| 2026-11-07 | 6-digit pickup code typed in by the seller (no QR, not a voucher) |
| 2026-11-07 | In-app RON wallet; digital euro kept open (research) |
| 2026-11-07 | Simulated top-up through a PaymentProvider layer; Stripe test mode as P1 |
| 2026-11-07 | Demo control panel (demo environment only) + pre-loaded data |
| 2026-11-07 | AI package: forecast, recommendation, insight text, seller insights (P0); personalised discovery (P1); cross-seller combining (P2) |
| 2026-11-07 | Commission charged to the seller on completed sales |
| 2026-11-07 | One responsive web app: buyer mobile-first, seller desktop-first |
| 2026-11-07 | Tech stack (see TECH_STACK.md); data model and lifecycles (see DATA_MODEL.md) |
| 2026-11-07 | 5-hour hackathon cut: demo user switcher, demo-panel closing, template AI text, no disputes/notifications/uploads |
| 2026-11-07 | Build with token-based default styling if Figma access is not available in time |

## Assumptions (not explicitly confirmed)

- The default commission is 5%.
- The seller sets the pickup deadline per product; platform default 7 days.
- The committed price is the tier price shown *before* joining, even if the buyer's own quantity crosses a threshold.
- A buyer who joins a group that has already unlocked a tier can't cancel (follows from the cancellation rule; the UI warns them).
- Stock is reserved when a buyer joins; sold out → no new joins; the seller can't lower stock below the committed quantity.
- If no tier is unlocked, the purchase completes at the base price.
- Buyers can join until the group's closing time (server clock).
- The highest tier threshold must be ≤ stock.
- Pickup code: single use; 5 wrong attempts → 15-minute lock.
- Renewal stops when the product is inactive, the duration is removed, or stock is exhausted; open groups always settle.
- One pickup location per seller in the MVP.
- Seller payouts to a bank account are out of MVP scope.

## Open questions

- When will Figma access be available, and which pages are final?
- Should a group show a minimum "closing soon" join cutoff (e.g. no joins in the last 5 minutes)?
- Pickup opening hours: does the deadline count calendar days or opening days?
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
