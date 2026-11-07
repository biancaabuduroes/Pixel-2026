// Onboarding options and copy shared by the screens (client) and the validation (server).
// Copy is Romanian, taken from the Figma flow "onboarding-flow".

export const ONBOARDING_STEPS = ["telefon", "cod", "nume", "preferinte", "buget", "locatie", "incarca"] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** NavBar progress: step number (1-based) out of the 7 steps after the intro slides. */
export const stepNumber = (step: OnboardingStep) => ONBOARDING_STEPS.indexOf(step) + 1;
export const TOTAL_STEPS = ONBOARDING_STEPS.length;

/** Phone step (mock): accepts "712 345 678", "0712 345 678", "+40 712 345 678" → "712345678". */
export function nationalNumber(typed: string): string {
  const d = typed.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("40")) return d.slice(2);
  if (d.length === 10 && d.startsWith("0")) return d.slice(1);
  return d;
}

export const LOCAL_PREFERENCE = [
  { value: "local", label: "Da, prefer local" },
  { value: "good-price", label: "Când prețul e bun" },
  { value: "any", label: "Nu contează" },
] as const;

export const CATEGORIES = [
  { value: "alimente", label: "Alimente" },
  { value: "ulei-camara", label: "Ulei și cămară" },
  { value: "scutece-bebelusi", label: "Scutece și bebeluși" },
  { value: "curatenie", label: "Curățenie" },
  { value: "ingrijire-personala", label: "Îngrijire personală" },
  { value: "animale", label: "Animale de companie" },
  { value: "casa-gradina", label: "Casă și grădină" },
  { value: "electronice-mici", label: "Electronice mici" },
] as const;

/** Budget slider in whole RON (stored in bani). Steps approved 2026-11-07. */
export const BUDGET = {
  week: { min: 50, max: 1500, step: 50, initial: 400, label: "Pe săptămână", caption: "pe săptămână" },
  month: { min: 200, max: 6000, step: 200, initial: 1600, label: "Pe lună", caption: "pe lună" },
} as const;

export const RADIUS_KM = [1, 3, 5, 10] as const;
/** Mock map numbers per radius (demo only; no real location data). */
export const NEARBY_MOCK: Record<(typeof RADIUS_KM)[number], { groups: number; stores: number }> = {
  1: { groups: 4, stores: 1 },
  3: { groups: 14, stores: 3 },
  5: { groups: 22, stores: 5 },
  10: { groups: 37, stores: 7 },
};
export const DEMO_ADDRESS = "Bd. Independenței 5, Iași";
/** Used when the browser can't or may not share its location. */
export const DEMO_POSITION = { lat: 47.16778, lng: 27.58306 };

export const TOP_UP_PRESETS = [50, 100, 200, 500] as const;
export const TOP_UP_MIN_RON = 10;

/** The predefined demo users (prisma/seed.sql). The mocked phone sign-up logs into the buyer. */
export const DEMO_BUYER_EMAIL = "cumparator@bundeals.ro";
export const DEMO_SELLER_EMAIL = "vanzator@bundeals.ro";
export const DEMO_PASSWORD = "bundeals2026";
