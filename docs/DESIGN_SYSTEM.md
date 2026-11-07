# BunDeals – Design System

> **Connected (2026-11-07).** Figma file **DS-BunDeals** (`6Ld1cezE2E4IpeppWJiq7O`) is the source of truth.
> Don't redesign its screens without discussing it first; deviations are listed in section 4.

## 1. How Figma and code are linked

- **Tokens:** every Figma variable has the code syntax `var(--token-name)`. The **same names** are defined once in `src/styles/globals.css` (`:root`). A token change in Figma = one value edited there. Only the *Core brand* colour mode is implemented; no dark mode.
- **Tailwind:** `@theme inline` exposes the tokens as classes (table below). shadcn/ui's semantic variables (`--primary`, `--border`, `--ring`…) point at the Figma tokens, so shadcn components follow Figma too.
- **Text styles:** each Figma text style is one utility class with the same name as the style (`Display/display-lg` → `display-lg`, `Text/body-md` → `body-md`).
- **Fonts:** DM Sans 400/600/700 (`--font-sans`) and Barlow Condensed ExtraBold 800 (`--font-display`), loaded with `next/font/google` in `src/app/layout.tsx`.
- **Icons:** exported from Figma as SVG into `public/figma/` (colour baked in, name `<icon>-<size>[-<colour>]`) and rendered with `<Icon name=… size=…>` (`src/components/ds/icon.tsx`).
- **Components:** one file per Figma component in `src/components/ds/` (Button and Input restyled in `src/components/ui/`). Each file names its Figma node.

## 2. Token → class mapping

| Figma | CSS variable | Tailwind class |
|---|---|---|
| `bg/*` (canvas, surface, subtle, muted, strong, disabled, action, inverse, brand, brand-strong, brand-soft, deal, deal-soft, success, success-strong, success-soft, danger, danger-soft, info, info-soft, scrim) | `--bg-*` | `bg-bg-*` (e.g. `bg-bg-brand-soft`) |
| `text/*` (primary, secondary, inverse, brand, on-brand, deal, success, danger, info) | `--text-*` | `text-text-*` |
| `icon/*` | `--icon-*` | `text-icon-*` (icons are mostly SVG files) |
| `border/*` (default, subtle, control, strong, surface, brand, danger) | `--border-*` | `border-border-*` |
| `space/2…32`, `inset-page` | `--space-*`, `--inset-page` | Tailwind 4px grid: `space-8` = `2`, `space-16` = `4`, `space-24` = `6` (e.g. `gap-4`, `pt-6`); `px-page` |
| `radius/xs, sm, md, lg, xl, pill` (4, 8, 12, 16, 24, 999) | `--radius-*` | `rounded-xs` … `rounded-xl`, `rounded-pill` |
| `size/control-sm, md, lg` (32, 44, 56), `navbar-h` 52, `otp-cell` 48 | `--control-*`, `--navbar-h`, `--otp-cell` | `h-control-lg`, `size-control-md`, `h-navbar`, `w-otp-cell` |
| `stroke/hairline, strong` (1, 2) | `--stroke-*` | `border`, `border-2` |
| `opacity/disabled` (45%) | `--opacity-disabled` | `opacity-(--opacity-disabled)` |
| `Shadow/shadow-card, raised, sheet` | — | `shadow-card`, `shadow-raised`, `shadow-sheet` |
| `Display/display-xl, lg, md` (Barlow Condensed 800: 56/64, 36/40, 28/32) | `--display-*-font-size/line-height` | `display-xl`, `display-lg`, `display-md` |
| `Text/title-lg, md, sm` (700), `label-lg, md, sm` (600), `body-lg, md, sm, body-compact`, `caption` (400) | `--text-lg/md/sm-font-size/line-height` | same names: `title-md`, `label-lg`, `body-md`, `caption` … |

## 3. Component map

| Figma component (node) | Code |
|---|---|
| Button (10:110) — Primary, Secondary, Tertiary, Brand, Inverse, Disabled, Link × lg/md/sm | `ui/button.tsx` (`variant`, `size`, `disabled`) |
| TextField (13:77) — label, prefix, suffix, helper, Error | `ds/text-field.tsx`; bare field: `ui/input.tsx` |
| NavBar · Onboarding (15:50) + ProgressBar | `ds/nav-bar.tsx` (`OnboardingNavBar`) |
| PageDots (34:229) | `ds/page-dots.tsx` |
| OTPInput (34:305) | `ds/otp-input.tsx` (Base UI OTPField) |
| Countdown · Inline (35:264) | `ds/countdown.tsx` |
| InlineAlert (35:308) — Neutral, Info, Success, Danger, Deal | `ds/inline-alert.tsx` |
| Checkbox (13:119) / Radio (13:140) / Toggle (13:157) | `ds/checkbox.tsx` / `ds/radio-group.tsx` / `ds/toggle.tsx` (Base UI) |
| Slider (36:333) | `ds/slider.tsx` (Base UI) |
| SegmentedControl (11:43) | `ds/segmented-control.tsx` (Base UI ToggleGroup) |
| ChipGroup · Wrap (36:323) + Chip (11:127) | `ds/chip-group.tsx` |
| Tag (11:198) — soft tones | `ds/tag.tsx` |
| AmountTile (36:332) — lg (2×2, 88px) and sm (one row, 64px, top-up 64:1385) | `ds/amount-tile.tsx` (`size`) |
| ListRow · Chevron (15:145) | `ds/list-row.tsx` |
| SearchBar (13:94) | `ds/search-bar.tsx` |
| EmptyState (36:341) | `ds/empty-state.tsx` |
| BottomSheet (37:305) | `ds/bottom-sheet.tsx` (Base UI Drawer) |
| GroupStatusTimeline (36:438) + Timeline step (36:437) | `ds/timeline.tsx` |
| Splash (53:1330, logo image `public/figma/bundeals-logo.png`) | `src/app/onboarding/page.tsx` |
| QuantityStepper | `ds/quantity-stepper.tsx` |
| SearchDock · compact (85:4519) + Search drawer B3.2 (85:4587) | `buyer/home-deals.tsx`, `buyer/search-drawer.tsx`, `ds/bottom-sheet.tsx` (`header="nav"`) |
| SummaryRow (Joined / Pickup code sheets) | `ds/summary-row.tsx` |
| BottomSheet with left title (B4.1, B5.1b) | `ds/bottom-sheet.tsx` (`header="left"`) |
| GroupDealCard (B3.1) | `buyer/group-deal-card.tsx` |
| Countdown · Inline, not urgent (`02z 06h 00m`) | `buyer/deal-countdown.tsx` |
| Group progress bar (pool price card, Joined sheet) | `buyer/group-progress-bar.tsx` |
| ProgressBar (34:248) — xs/sm/md × Brand/Success/Deal | `ds/progress-bar.tsx` |
| SectionHeader (35:347) — Text/title-xl | `ds/section-header.tsx` |
| PriceTierList (38:374) + Tier row (38:373) | `ds/price-tier-list.tsx` |
| Buyer frames B3.1 Home, B3.3 Pool, B4.1 Joined, B5.1 Profile, B5.1b Pickup code | `src/app/page.tsx`, `src/app/produs/[id]`, `src/app/profil`, `components/buyer/**` |
| Onboarding frames B1.1–B1.5 (top-up: 64:1385) | `src/app/onboarding/**`, shared frame `components/onboarding/onboarding-screen.tsx`, real map `components/onboarding/real-map.tsx` |
| Seller dashboard (not in Figma; desktop analytics shell from tokens) | `src/app/seller/**`, `components/seller/**` (SellerPanel, MetricPills, KPI accent cards, catalog/orders tables, SVG area chart, insight cards, groups filter, margin calculator) |

Text styles added for the buyer flow: `title-xl` (20/26 bold) and `display-sm` (Barlow 800, 22/32).

Not built yet (no screen uses them): Tabs, TabBar, IconButton variants beyond back/close, ProductCard, Toast, Skeleton, Accordion, TierEditor, and the other cards. They are built when their screens are.

## 4. Deviations from Figma (all approved or to confirm)

- iOS status bar and home indicator are not drawn (they belong to the phone).
- **Login screen** (`/autentificare`) is not in Figma; it reuses B1.2a's layout and components (approved).
- **Top-up demo-money caption** under the buttons (BUSINESS_LOGIC §9). *To confirm with the designer.*
- **Map:** a real OpenStreetMap embed replaces the drawn map (requested); store pins removed (no real store data yet); the radius tag sits top-left so the map attribution stays readable.
- **Top-up under 10 RON:** not designed in 64:1385; uses the TextField error style and the Disabled button.
- The NavBar progress follows the step (1/7 … 7/7); Figma shows a fixed 40% placeholder, as its description says to resize it per step.
- On screens wider than a phone, the column stays 430px wide and centred.
- **Buyer flow copy:** "persoane" → "unități" (thresholds are units); "Probabil plătești" carries "(estimare)"; no store distance (no store coordinates yet).
- **Buyer flow states not in Figma** (built from existing components): insufficient balance, already in the group, group closed, sold out, not signed in (InlineAlert / EmptyState); cancel button and cancel-locked note on order cards; wallet history list; quantity row in the bottom bar; pickup details sheet; 6-digit manual code row in the pickup sheet.
- **Baskets (not in Figma):** "Coșuri de cumpărături" / "Produse individuale" section titles, "Coș · N produse" line on deal cards, "Ce conține coșul" list on the Pool page. The search field has no clear (×) button yet (Filled state).
- **Skipped (out of scope):** share button, carousel dots, "Compară vânzătorii", invite card in the Joined sheet, edit profile (B5.1a), notifications bell, account/notification rows.
- **Seller dashboard:** no Figma frames; desktop analytics layout from existing light-mode tokens (not a dark theme). Shared `SellerPanel` / `MetricPills` chrome, denser tables, sticky nav with active state, SVG area chart (no chart library). No group-level pickup QR (only the buyer's order QR, BL §8). Margin calculator is local/unsaved. Product pickup editing deferred.

## 5. BunDeals screens still to build (map to the Figma components above)

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
| Seller dashboard pages | KPI, catalog, groups, group details | Empty history, critical stock, near tier |
| `PickupCodeForm` (seller) | Code input | Wrong code, locked |

## 6. Likely gaps to raise with the designer

States that collective buying needs and that designs often miss: tier unlocked while waiting, cancel locked, insufficient balance, group closed while joining, sold out, released-funds confirmation, pickup code and expiry, demo-money labelling, wrong pickup code and lockout.
