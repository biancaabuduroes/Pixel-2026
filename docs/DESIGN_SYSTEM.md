# BunDeals – Design System

> **Status: placeholder.** The Figma file belongs to our UI/UX designer and hasn't been connected yet.
> Figma is the primary visual reference. Don't redesign its screens without discussing it first.

## 1. Hackathon approach (approved 2026-11-07)

- If Figma access arrives in time, the key screens are followed as closely as the 5-hour build allows.
- Otherwise the UI is built with clean shadcn/ui defaults, with all colours, spacing and typography defined as **design tokens** in one place, so the visual style can be switched to the Figma system afterwards without touching components.

## 2. Connecting Figma (when access is available)

**The designer (file owner):**
1. Shares the file with the developer's Figma account, at least **"can view"**.
2. Ideally gives a Dev or Full seat on their paid plan, for full design data and higher usage limits.
3. Marks which pages are final and which are drafts.

**The developer:**
1. Runs `claude mcp add --transport http figma https://mcp.figma.com/mcp`.
2. In Claude Code, runs `/mcp` → Figma → logs in through the browser.
3. Gives Claude links to frames or pages. Access is read-only; Claude doesn't change the Figma file.

## 3. To document after connecting

- [ ] Pages, frames and screen inventory
- [ ] Tokens: colours, typography, spacing, radii, shadows
- [ ] Components and variants → mapping to `src/components`
- [ ] Navigation and breakpoints (buyer: mobile-first; seller: desktop-first)
- [ ] Loading, empty, error and success states
- [ ] Accessibility (contrast, focus, touch targets)

## 4. Components specific to BunDeals (to check against Figma)

| Component | Must show | States to verify in Figma |
|---|---|---|
| `TierLadder` | All tiers, current tier highlighted | Base only, tier unlocked, top tier reached |
| `GroupCard` | Time left, quantity, buyers, current price, units to the next tier, forecast, labels | Recommended, closest, sold out, closing soon |
| `GroupProgress` | Progress towards the next threshold | Tier unlocked (celebration), top tier reached |
| `JoinSheet` | Quantity, committed price per unit, maximum amount, cancellation warning | Insufficient balance, already joined, group just closed |
| `CommitmentCard` | Status, current/final price, savings, cancel | Cancel allowed vs locked (with reason) |
| `PickupCode` | 6-digit code + QR, location, deadline | Collected, expired |
| `WalletSummary` | Available, reserved, pending pickup, savings | Empty wallet, demo-money label |
| `TierEditor` (seller) | Tier rows, cap, durations | Validation errors |
| `PickupCodeForm` (seller) | Code input | Wrong code, locked |

## 5. Likely gaps to raise with the designer

States that collective buying needs and that designs often miss: tier unlocked while waiting, cancel locked, insufficient balance, group closed while joining, sold out, released-funds confirmation, pickup code and expiry, demo-money labelling, wrong pickup code and lockout.
