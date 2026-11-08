// Supermarket branding for the demo (2026-11-08). Pickup locations belong to a seller, so the
// store logo comes from the seller's business name; no schema change. Unknown sellers → no logo.
const BRANDS: Record<string, { logo: string; wordmark: string }> = {
  Penny: { logo: "/brands/penny.webp", wordmark: "/brands/penny-wordmark.webp" },
};

/** Square store logo (buyer side: supermarket cards, store page, pickup line). */
export const storeLogo = (businessName: string | null | undefined) => (businessName ? (BRANDS[businessName]?.logo ?? null) : null);

/** Wide wordmark (seller dashboard header). */
export const storeWordmark = (businessName: string | null | undefined) => (businessName ? (BRANDS[businessName]?.wordmark ?? null) : null);
