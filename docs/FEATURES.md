# BunDeals – Feature Catalogue

> Priorities: **P0** = hackathon MVP · **P1** = full MVP / next phase · **P2** = optional enhancements.
> Business rules are referenced as BL §n ([BUSINESS_LOGIC.md](BUSINESS_LOGIC.md)).

## P0 – Hackathon MVP

### F1. Demo user switcher — all roles
- **Story:** As a presenter, I want to switch between demo buyer, seller and admin accounts so I can show every journey.
- **Behaviour:** pick from pre-loaded users; the session is stored in a cookie. Only available with `DEMO_MODE`.
- **Acceptance:** switching the role changes the navigation and the data shown; disabled when `DEMO_MODE` is off.

### F2. Product discovery and details — buyer
- **Story:** As a buyer, I want to browse products and see the price tiers so I understand how the price can drop.
- **Screens:** home/product list, product detail.
- **Behaviour:** each product shows image, seller, pickup location, base price, the tier ladder with the current tier highlighted, and the best active group's progress.
- **Acceptance:** tiers are shown in ascending order of quantity; sold-out products show "Sold out" and can't be joined.

### F3. Group selection with recommendations — buyer (AI)
- **Story:** As a buyer, I want to compare the open groups and see which one is most likely to get me a lower price.
- **Behaviour:** one card per open group: time left, total quantity, buyer count, current price, units to the next tier, forecast (Likely / Possible / Unlikely). Labels "Recommended" (AI) and "Closest to unlocking" (calculated). Every recommendation shows its reasons. BL §11.
- **Acceptance:** every AI statement is labelled as an estimate; "units to the next tier" is exact.

### F4. Join a group — buyer
- **Story:** As a buyer, I want to choose a quantity and join, knowing my maximum cost.
- **Behaviour:** quantity selector (1…cap); shows the committed price per unit and the maximum amount; warns if the group has already unlocked a tier (cancelling won't be possible); confirm → funds reserved. BL §4.
- **Edge cases:** insufficient balance (link to top-up); already committed to this product; group closed meanwhile; stock exhausted meanwhile.
- **Acceptance:** two simultaneous joins can't oversell stock; the reserved amount = quantity × the displayed price; one active commitment per product.

### F5. My purchases — buyer
- **Story:** As a buyer, I want to track my commitments, the current price, and my final price and savings.
- **Behaviour:** list grouped by status. Active: current estimated price, progress, cancel button (only when allowed, BL §5). Awaiting pickup: final price, savings, released amount, pickup location, deadline, **6-digit code and its QR**. Completed and cancelled history.
- **Acceptance:** the cancel button is hidden or disabled with an explanation after a tier unlocks; the shown amounts match the ledger.

### F6. Wallet — buyer
- **Story:** As a buyer, I want to see my available, reserved and pending money and add funds.
- **Behaviour:** balances calculated from the ledger; simulated top-up labelled as demo money; transaction history; total savings. BL §9.
- **Acceptance:** submitting the same top-up twice credits it only once; available + reserved + pending = top-ups − payouts.

### F7. Product management with tier editor — seller
- **Story:** As a seller, I want to publish a product with price tiers, stock, a per-buyer cap and group durations.
- **Behaviour:** form with live validation (BL §2); publishing opens one group per duration.
- **Acceptance:** overlapping or non-decreasing tiers and a cap ≥ the first discount threshold are rejected, both in the form and on the server.

### F8. Groups and demand overview — seller
- **Story:** As a seller, I want to see each open group's progress and simple demand statistics.
- **Behaviour:** table of groups: quantity, buyers, current tier, time left. Statistics card: total committed, tiers unlocked, most popular duration.
- **Acceptance:** numbers match the commitments in the database.

### F9. Orders and pickup confirmation — seller
- **Story:** As a seller, I want to see orders to prepare and confirm pickups with the buyer's code.
- **Behaviour:** orders awaiting pickup (buyer name, quantity, amount, deadline); scan the buyer's QR (opens the confirm page with the code filled in) or type the code → order collected → earnings credited minus commission. Earnings balance shown. BL §8.
- **Acceptance:** a wrong code is rejected; 5 failures lock entry for 15 minutes; a code works once and only for its own order.

### F10. Group settlement and renewal — system
- **Behaviour:** close → final tier → `SETTLE` ledger entries → pickup codes → next group opens. Idempotent. BL §7.
- **Acceptance:** running close twice changes nothing the second time; final price ≤ committed price, always.

### F11. Demo control panel — admin (demo only)
- **Behaviour:** add simulated buyers, close a group now, expire pickup deadlines, reset the demo data. Uses the real server logic.
- **Acceptance:** unavailable when `DEMO_MODE` is off.

### F12. Tier forecast and insight text — AI
- **Behaviour:** forecast from join history; template sentences such as "83 buyers joined. 17 more units unlock 95 RON. Likely before this group closes (estimate)."
- **Acceptance:** text is generated only from computed values; it never affects price or payments.

### F13. Platform commission setting — admin
- **Behaviour:** commission rate (default 5%) used at payout.
- **Acceptance:** commission + seller amount = the amount charged, exactly (whole bani).

## P1 – Full MVP / next phase

| Feature | Notes |
|---|---|
| Real authentication (Supabase Auth) | Replaces F1 |
| Scheduled job (close, renew, deadlines) | Replaces the manual parts of F11 |
| LLM insight text (Claude Haiku 5.5, cached) + LLM seller insights | Templates stay as the fallback |
| Disputes ("Report a problem" + admin resolution) | BL §8 |
| In-app notifications (tier unlocked, group closed, pickup reminder) | |
| Stripe test mode top-up | Through `PaymentProvider` |
| Product image upload | Supabase Storage |
| Personalised product discovery | AI |
| Multiple pickup locations per seller | |
| Admin user/seller management, product moderation | |
| Seller payouts to a bank account | Needs a payment partner |
| Real-time progress (Supabase Realtime), Sentry, Playwright end-to-end tests | |

## P2 – Enhancements

| Feature | Notes |
|---|---|
| Combining demand across sellers or products | Needs a business agreement |
| Digital euro wallet option | Under research |
| Seller subscriptions or premium analytics | Business model extension |
| Delivery | **Requires explicit approval** |
