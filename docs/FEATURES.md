# BunDeals – Feature Catalogue

> Priorities: **P0** = hackathon MVP · **P1** = full MVP / next phase · **P2** = optional enhancements.
> Business rules are referenced as BL §n ([BUSINESS_LOGIC.md](BUSINESS_LOGIC.md)).

## P0 – Hackathon MVP

### F0. Buyer onboarding — buyer (Figma "onboarding-flow", B1.1–B1.5)
- **Story:** As a new buyer, I want a short introduction and setup so I understand group buying, bunToken and can top up before my first group.
- **Screens (Romanian):** splash (logo) → 3 welcome slides → phone → code → name → shopping preferences → budget → location → top up bunToken (optional), with the "Cum funcționează bunToken?" sheet. Then a home placeholder.
- **Behaviour:** phone and SMS code are **mocks** (any number, any 6 digits; nothing is sent) that sign in as the predefined demo buyer. Answers are saved to `User.preferences` (display only; no effect on prices or money). The location step shows a **real OpenStreetMap map** with the radius to scale; the address is found with OpenStreetMap's geocoder, and "Folosește locația mea" always shows the demo address **Bulevardul Lascăr Catargiu 47, București** (hardcoded for the demo; no location permission). The nearby-groups numbers are still mock. Top-up (Figma 64:1385): typed amount + presets, uses the simulated top-up (minimum 10 RON), labelled as demo money; the ⓘ in the top bar opens the bunToken explainer. Completion (or "Mai târziu") sets the `bd_onboarding_done` cookie; `/` sends visitors without it to `/onboarding`.
- **Acceptance:** "Continuă" is disabled until each step is valid (a 9-digit number typed as `712…`, `0712…` or `+40 712…`, first name, ≥ 1 category, an address, top-up ≥ 10 RON); the progress bar follows the step; reloading `/` after completion stays on home.

### F1. Demo login — all roles
- **Story:** As a presenter, I want to sign in as the demo buyer or seller so I can show every journey.
- **Behaviour:** `/autentificare` (from "Am deja cont" or "Continuă cu email"): email + password for the 2 predefined users (`prisma/seed.sql`). The session is a signed cookie. Only available with `DEMO_MODE`. Replaces the earlier user-switcher idea (decision 2026-11-07).
- **Acceptance:** a wrong password is rejected; an edited session cookie is rejected; sign-out returns to the login.

### F2. Product discovery and details — buyer
- **Story:** As a buyer, I want to browse products and see the price tiers so I understand how the price can drop.
- **Screens:** home/product list, product detail.
- **Behaviour:** each product shows image, seller, pickup location, base price, the tier ladder with the current tier highlighted, and the best active group's progress.
- **Acceptance:** tiers are shown in ascending order of quantity; sold-out products show "Sold out" and can't be joined.
- **Built (Figma B3.1 / B3.3):** Home `/` (location header, savings banner, "Grupurile mele", category chips from `Product.category`, "Se închid curând" rail, "Grupuri lângă tine" list — one GroupDealCard per product, showing its recommended group); Pool page `/produs/[id]` (hero, price card, "Prețuri pe trepte" ladder in units, pickup row).

### F3. Group selection with recommendations — buyer (AI)
- **Story:** As a buyer, I want to compare the open groups and see which one is most likely to get me a lower price.
- **Behaviour:** one card per open group: time left, total quantity, buyer count, current price, units to the next tier, forecast (Likely / Possible / Unlikely). Labels "Recommended" (AI) and "Closest to unlocking" (calculated). Every recommendation shows its reasons. BL §11.
- **Acceptance:** every AI statement is labelled as an estimate; "units to the next tier" is exact.
- **Built:** the Pool page selector maps open groups by closing time (Rapid / Echilibrat / Cel mai ieftin; hidden with one group), the AI-recommended group is pre-selected and marked "Recomandat pentru tine". Live progress is polled every 10 s (TanStack Query, `GET /api/groups/[id]/progress`).

### F4. Join a group — buyer
- **Story:** As a buyer, I want to choose a quantity and join, knowing my maximum cost.
- **Behaviour:** quantity selector (1…cap); shows the committed price per unit and the maximum amount; warns if the group has already unlocked a tier (cancelling won't be possible); confirm → funds reserved. BL §4.
- **Edge cases:** insufficient balance (link to top-up); already committed to this product; group closed meanwhile; stock exhausted meanwhile.
- **Acceptance:** two simultaneous joins can't oversell stock; the reserved amount = quantity × the displayed price; one active commitment per product.
- **Built (Figma B4.1):** fixed bottom bar with QuantityStepper and "Intră în grup · max X bunToken" → `joinGroupAction` → "Ești în grup!" sheet (funds lock card, estimated final price and difference, live progress, "Ce urmează"). Edge cases shown with InlineAlert (not in Figma).

### F5. My purchases — buyer
- **Story:** As a buyer, I want to track my commitments, the current price, and my final price and savings.
- **Behaviour:** list grouped by status. Active: current estimated price, progress, cancel button (only when allowed, BL §5). Awaiting pickup: final price, savings, released amount, pickup location, deadline, **6-digit code and its QR**. Completed and cancelled history.
- **Acceptance:** the cancel button is hidden or disabled with an explanation after a tier unlocks; the shown amounts match the ledger.
- **Built (Figma B5.1 / B5.1b):** "Comenzile mele" on `/profil` (Active · N / Anterioare), order cards, "Arată codul de ridicare" sheet with QR + 6-digit code; "Renunță la grup" when allowed, locked note otherwise. `/purchases` redirects to `/profil`. Groups past closing that the buyer is in are settled when Home or Profile loads (demo assumption: no scheduler yet).

### F6. Wallet — buyer
- **Story:** As a buyer, I want to see my available, reserved and pending money and add funds.
- **Behaviour:** balances calculated from the ledger; simulated top-up labelled as demo money; transaction history; total savings. BL §9.
- **Acceptance:** submitting the same top-up twice credits it only once; available + reserved + pending = top-ups − payouts.
- **Built:** wallet card on `/profil` (available, reserved, "Încarcă" → top-up screen, "Cum funcționează" sheet) and "Istoric portofel" (last 20 movements of the available balance). Savings are on the Home banner.

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
- **Acceptance:** a wrong code is rejected; 5 failures lock entry for 15 minutes; a code works once and only for its own order. Screens: buyer `/purchases` (QR + code), seller `/seller/pickup`.

### F10. Group settlement and renewal — system
- **Behaviour:** close → final tier → `SETTLE` ledger entries → pickup codes → next group opens. Idempotent. BL §7.
- **Acceptance:** running close twice changes nothing the second time; final price ≤ committed price, always.

### F11. Demo control panel — admin (demo only)
- **Behaviour:** add simulated buyers, close a group now, expire pickup deadlines, reset the demo data. Uses the real server logic.
- **Acceptance:** unavailable when `DEMO_MODE` is off.

### F12. Tier forecast and insight text — AI
- **Behaviour:** forecast from join history; template sentences such as "83 buyers joined. 17 more units unlock 95 RON. Likely before this group closes (estimate)."
- **Acceptance:** text is generated only from computed values; it never affects price or payments.
- **Built:** "Probabil plătești X (estimare)" = next tier price when the forecast is Likely, else the current price; "Probabil" ladder tag; "Estimare AI: șanse mari/medii/mici…" caption (`src/domain/ai/offer.ts`).

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
