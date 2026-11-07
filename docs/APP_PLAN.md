# BunDeals – Application Plan

> Pixel 2026 Hackathon · Theme: AI + Digital Currency · Last updated: 2026-11-07
> Status: discovery complete, hackathon MVP approved (5-hour build).

## 1. Business context

BunDeals is a collective buying platform. Instead of negotiating individually, consumers join time-limited purchasing groups. As a group's total quantity grows, it unlocks lower **seller-defined** price tiers. AI helps buyers pick the group most likely to unlock a discount and helps sellers understand demand. Payments run through an in-app RON wallet.

## 2. Product vision

"The more people buy together, the better the price can become" — with full transparency: rules decide prices, AI only estimates and explains, and a buyer never pays more than they committed to.

## 3. Target users

| Role | Needs |
|---|---|
| **Buyer** | Find deals, understand tiers, choose a group, know the maximum commitment, track the price, pay through the wallet, collect the product |
| **Seller** | Publish products with tiers, see demand, prepare orders, confirm pickups, get paid |
| **Admin** | Platform settings (commission), dispute handling (P1), demo control (hackathon only) |

## 4. Value proposition

- **Buyers:** lower prices through pooled demand; never pay more than committed; transparent rules.
- **Sellers:** pre-paid, guaranteed volume before the goods are handed over; demand visibility before ordering or producing; less unsold stock.
- **Economic logic:** the seller trades a lower margin per unit for more volume, certainty and lower selling costs. BunDeals turns scattered demand into orders the seller can plan around.

## 5. Business model

- **Commission charged to the seller** on each completed sale, deducted when the money is paid to the seller. Default 5%, configurable as a platform setting.
- Buyers pay exactly the seller's tier price — no buyer fees.
- Future options (not MVP): premium seller analytics, seller subscriptions.

## 6. Confirmed business rules

1. Sellers define price tiers. The platform never negotiates or invents discounts.
2. Buyers don't choose or negotiate prices.
3. **Parallel groups:** the seller chooses which durations to offer (e.g. 24h, 7 days). Each duration has exactly one open group per product, and it renews automatically when it closes.
4. The buyer chooses which group to join. The system shows "closest to the next tier" (exact calculation) and "recommended" (AI estimate). The buyer makes the final choice.
5. **Every unit** gets the tier price reached by the group's total quantity when it closes. Each group counts only its own quantity.
6. A buyer never pays more than the committed price per unit shown when joining.
7. A buyer chooses a quantity up to a per-buyer cap set by the seller. **The cap must be lower than the first discount threshold.**
8. A buyer can hold **only one active commitment per product**.
9. **Cancellation:** allowed until the group unlocks its first lower tier, and not after.
10. Pickup only — no delivery.
11. In-app RON wallet — no vouchers or QR redemption.
12. Payment flow: reserve on join → final amount to *pending pickup* at close (difference released) → paid to the seller on pickup.
13. Pickup is confirmed with a **6-digit code** shown to the buyer and typed in by the seller. It carries no value and is not a voucher (an approved clarification of rule 11).
14. If the buyer doesn't collect by the pickup deadline, the seller is paid anyway. Buyers can report a problem, and an admin resolves it manually (P1).
15. AI predictions are estimates only and never decide prices or payments.
16. One web app: mobile-first for buyers, desktop-first for the seller dashboard.

Full mechanics: [BUSINESS_LOGIC.md](BUSINESS_LOGIC.md).

## 7. Main workflows

1. **Seller setup:** create product → tiers → stock, cap, durations, pickup deadline → publish (groups open automatically).
2. **Buyer join:** top up wallet → browse → choose a group (with recommendations) → choose a quantity → confirm (funds reserved).
3. **Group progress:** other buyers join → a tier may unlock → the buyer's estimated price drops; cancelling is locked.
4. **Settlement:** group closes → final price → amount moved to pending pickup, difference released → next group opens.
5. **Pickup:** buyer shows code → seller enters it → seller paid minus commission.

## 8. MVP scope

The **hackathon MVP** (5-hour build) is a reduced version of the **full MVP** approved during discovery. The business rules are identical; supporting features are simplified. See [FEATURES.md](FEATURES.md) for the catalogue and [ROADMAP.md](ROADMAP.md) for the plan.

| Area | Hackathon MVP | Full MVP (next phase) |
|---|---|---|
| Authentication | Demo user switcher | Supabase Auth (email) |
| Group closing | Demo panel button | Scheduled job every minute |
| AI insight text | Templates (Claude API if time allows) | Claude Haiku 5.5, cached |
| Seller insights | Simple statistics card | Statistics + LLM summary |
| Disputes, notifications, image upload | Not included | Included |

## 9. Demo script (~5 minutes)

1. Seller creates a product with three tiers, offering 24h and 7-day groups.
2. Buyer tops up 500 RON and sees "Recommended: 7-day group, likely to unlock 95 RON".
3. Buyer joins with 3 units → 300 RON reserved.
4. Demo panel: simulated buyers join → tier unlocks → estimated price drops, cancel is locked.
5. Demo panel: close the group → 285 RON pending pickup, 15 RON released, "You saved 15 RON".
6. Seller enters the buyer's pickup code → seller paid 270.75 RON, BunDeals commission 14.25 RON.
7. Seller dashboard shows demand statistics.

## 10. Beyond the hackathon

- Real authentication, scheduled jobs, notifications, disputes.
- Stripe test mode → real payment provider (after legal review).
- Digital euro research.
- Personalised discovery, multiple pickup locations, seller payouts.
- Combining demand across sellers (P2, needs a business agreement).
