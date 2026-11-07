# BunDeals – Business Logic

> The source of truth for pricing, groups, the wallet and settlement.
> Read this before changing any money or pricing code.

## 1. Money

- All amounts are **integers in bani** (1 RON = 100 bani). Never use floating-point numbers for money.
- Currency: RON only in the MVP. Ledger records carry a currency field so other currencies (e.g. a digital euro option) can be added later.
- All prices are calculated **on the server only**. The browser only displays them.

## 2. Seller pricing configuration

A product has:
- `stockTotal` — the total units available across all groups.
- `perBuyerCap` — the maximum quantity per buyer.
- `priceTiers` — a list of `{ minQty, unitPrice }`.
- `durations` — the group durations offered (e.g. 24h, 72h, 168h).
- `pickupDeadlineDays` — days after a group closes in which the buyer must collect.

**Tier validation (in the form and again on the server):**
1. There is at least one tier, and the first tier has `minQty = 1`. That tier's price is the base price.
2. `minQty` values strictly increase, with no duplicates. Each tier ends where the next one starts, so there are no gaps or overlaps.
3. `unitPrice` strictly decreases as `minQty` increases, and every price is > 0.
4. `perBuyerCap >= 1` and `perBuyerCap < minQty of the second tier`. No single buyer can unlock a discount alone.
5. The highest threshold must be ≤ `stockTotal`, otherwise that tier can never be reached. *(Assumption)*
6. At least one duration is offered.
7. In the MVP, sellers don't edit tiers after publishing. The system blocks tier edits while a group is open; edits apply only to future groups.

`tierPrice(qty)` = the `unitPrice` of the tier with the highest `minQty ≤ qty`, with a minimum of `qty = 1`, so an empty group shows the base price.

## 3. Groups

- For each product and offered duration, there is **exactly one open group** at a time (a database constraint).
- A group has `opensAt`, `closesAt = opensAt + duration`, a state, and its total quantity (the sum of active commitment quantities).
- Each group counts **only its own quantity**. Parallel groups never combine.

**Lifecycle:** `open → settling → settled` (plus `cancelled`, for admins only)

| State | Meaning |
|---|---|
| `open` | Accepts joins while `now < closesAt` (server clock) |
| `settling` | Locked; the final price is being applied |
| `settled` | Final price fixed; commitments moved to `awaiting_pickup` |
| `cancelled` | Admin-only exception; all reservations released |

"Tier unlocked" is a fact about an open group (`totalQty >= second tier's minQty`), not a separate state.

**Renewal:** when a group closes, a new group with the same duration opens immediately, as long as the product is active, the duration is still offered, and stock remains. Groups that are already open always settle.

**Hackathon MVP:** groups are closed from the demo panel (by setting `closesAt = now` and running the same closing code). The full MVP adds a scheduled job every minute. Closing must be **idempotent**: running it twice has no extra effect.

## 4. Buyer participation (joining)

Joining is **one database transaction**:
1. Lock the group row. Check it is `open` and `now < closesAt`.
2. Check that the buyer has no active commitment for this product.
3. Check that `1 ≤ quantity ≤ perBuyerCap`.
4. Check stock: `quantity ≤ stockTotal − sum(quantity of all commitments for this product that are not cancelled or refunded)`.
5. `committedUnitPrice = tierPrice(group.totalQty)`, the price shown to the buyer *before* joining. *(Assumption: if this join itself crosses a threshold, the buyer still commits at the price shown and pays the lower price at settlement.)*
6. `reservedAmount = quantity × committedUnitPrice`. Check the buyer's available balance is ≥ `reservedAmount`.
7. Create the commitment (`active`), post a ledger transaction `RESERVE` (available → reserved), and update the group's total quantity.

If any check fails, nothing is written.

## 5. Cancellation

A buyer may cancel an `active` commitment only if the group **has not unlocked its first lower tier** (`group.totalQty < second tier's minQty`) and the group is still `open`.

Consequences:
- After a tier unlocks, nobody can leave, so the group's quantity, and therefore its price, can never go back up.
- A buyer who joins a group that has already unlocked a tier cannot cancel. *(This follows directly from the rule; the UI must warn the buyer before they confirm.)*

On cancel: commitment → `cancelled`; ledger `RELEASE` (reserved → available) for the full reserved amount; the group's total quantity drops.

## 6. Price terminology

| Term | Definition |
|---|---|
| Initial displayed price | `tierPrice(group.totalQty)` shown before joining |
| Committed price per unit | That same price, stored on the commitment |
| Maximum committed amount | `quantity × committedUnitPrice` = the reserved amount |
| Current estimated price | `tierPrice(group.totalQty)` while the group is open (live) |
| Final price per unit | `tierPrice(group.totalQty)` at close |
| Amount charged | `quantity × finalUnitPrice` |
| Released difference | `reservedAmount − amountCharged` |
| Savings | `quantity × (base price − finalUnitPrice)` |

**Guarantee:** `finalUnitPrice ≤ committedUnitPrice`. This follows from the cancellation rule. Settlement still *asserts* it and stops with an error if it's ever violated.

## 7. Settlement (group close)

For each group, in one transaction:
1. Lock the group; if it is already `settled`, stop (idempotent).
2. `finalUnitPrice = tierPrice(totalQty)`; set state `settling`.
3. For each `active` commitment:
   - `amountCharged = quantity × finalUnitPrice`; assert `≤ reservedAmount`.
   - Ledger `SETTLE`: reserved → pending pickup (`amountCharged`); reserved → available (the difference).
   - Commitment → `awaiting_pickup`, generate a 6-digit pickup code (stored hashed), set `pickupDeadline = closesAt + pickupDeadlineDays` (calendar days: `pickupDeadlineDays × 24h`, UTC).
4. Group → `settled`; open the next group (renewal rules).

If no tier was unlocked, buyers pay the base price (= their committed price) and nothing is released.

## 8. Pickup

- The buyer sees the 6-digit code in "My purchases". The seller types it on the order.
- Correct code → commitment `collected`; ledger `PAYOUT`: pending pickup → seller earnings (amount − commission) and → platform revenue (commission).
- **Commission** = `round(amountCharged × commissionRate)`, rounding half up to whole bani. The seller gets the remainder, so the two parts always add up exactly to the amount. The rate is handled as integer basis points (`0.05` = 500 bp), so no floating-point maths touches money.
- Wrong code: after 5 failed attempts on an order, entry is locked for 15 minutes. *(Assumption)*
- Each code works once, only for that order, and only for that seller.

**No-show:** after `pickupDeadline`, the commitment is closed as `expired_paid` and the same `PAYOUT` is posted. (Hackathon MVP: a demo panel button. Full MVP: the scheduled job.)

**Dispute (P1):** the buyer reports a problem → commitment `disputed` (payout frozen) → an admin decides: pay the seller, or refund the buyer (pending pickup → available).

## 9. Wallet (ledger)

The wallet is a **double-entry ledger**. Balances are never stored; they're calculated from the ledger entries.

**Accounts:**

| Account | Owner |
|---|---|
| `buyer_available` | Buyer |
| `buyer_reserved` | Buyer |
| `pending_pickup` | Buyer (money committed to a settled order, waiting for pickup) |
| `seller_earnings` | Seller |
| `platform_revenue` | Platform |
| `external_funding` | System (the source of simulated top-ups; becomes the payment provider later) |

**Transaction types:** `TOPUP`, `RESERVE`, `RELEASE` (cancel), `SETTLE`, `PAYOUT`, `REFUND` (P1).

**Rules:**
- Every transaction has a unique operation ID. Inserting the same one twice fails, which prevents duplicate charges.
- Each transaction's entries add up to zero.
- Entries are never edited or deleted. Corrections are new transactions.
- Every transaction references what caused it (commitment, group, top-up).

**Buyer wallet view:**
- Available
- Reserved (active commitments)
- Pending pickup
- Transaction history
- Total savings

**Top-up (MVP):** simulated, through a `PaymentProvider` interface (`SimulatedProvider`). Stripe test mode is planned as P1. The UI clearly labels this as demo money.

## 10. Commitment lifecycle

```
active ──cancel (before the first tier unlocks)──> cancelled
active ──group settles──> awaiting_pickup ──code entered──> collected
                                          ──deadline passed──> expired_paid
                                          ──problem reported (P1)──> disputed ──admin──> collected | refunded
```

## 11. AI (estimates only)

- **Tier forecast:** from the group's join history (quantity added per hour) and the time remaining, estimate whether the next threshold will be reached. Shown as Likely / Possible / Unlikely, never as a guarantee.
  - `pace = units joined since the group opened ÷ max(1, hours elapsed)`; `projected = pace × hours left`; `ratio = projected ÷ units missing`.
  - **Likely** if ratio ≥ 1.25, **Possible** if ≥ 0.75, otherwise **Unlikely**. No forecast once the top tier is reached.
- **"Closest to unlocking":** the exact number of units missing to the next tier. This is a calculation, not AI.
- **Recommendation:** rank the open groups the buyer can join by **expected unit price** = `p × next-tier price + (1 − p) × current price`, with p = 80% (Likely), 50% (Possible), 20% (Unlikely); lowest first, so a discount already unlocked counts. Earlier closing breaks ties. Always show the reasons.
- **Insight text:** generated from computed numbers only (templates in the hackathon MVP; Claude Haiku 5.5 later, with a template fallback).
- AI output never feeds into pricing, settlement or the wallet.

## 12. Hackathon demo controls (demo environment only)

The demo panel can:
- Add simulated buyers to a group.
- Close a group now.
- Expire pickup deadlines.
- Reset the demo data.

Every action calls the same server logic as real operations. The panel is disabled unless `DEMO_MODE=true`.
