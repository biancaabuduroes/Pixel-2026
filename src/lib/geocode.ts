// Address lookup for the onboarding map, using OpenStreetMap's free Nominatim service
// (no API key; called from the browser only when the user submits, as its usage policy asks).
import type { LatLng } from "@/components/onboarding/real-map";

type NominatimPlace = {
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, string>;
};

const BASE = "https://nominatim.openstreetmap.org";

/** "Bulevardul Independenței 5, Iași" instead of the full administrative chain. */
function shortLabel(place: NominatimPlace): string {
  const a = place.address ?? {};
  const street = [a.road ?? a.pedestrian ?? a.square, a.house_number].filter(Boolean).join(" ");
  const city = a.city ?? a.town ?? a.village ?? a.municipality;
  return [street, city].filter(Boolean).join(", ") || place.display_name.split(",").slice(0, 2).join(",");
}

const toResult = (p: NominatimPlace) => ({ label: shortLabel(p), position: { lat: Number(p.lat), lng: Number(p.lon) } });

export async function findAddress(query: string): Promise<{ label: string; position: LatLng } | null> {
  const url = `${BASE}/search?format=jsonv2&limit=1&addressdetails=1&countrycodes=ro&accept-language=ro&q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const [place] = (await response.json()) as NominatimPlace[];
  return place ? toResult(place) : null;
}

export async function addressAt(position: LatLng): Promise<string | null> {
  const url = `${BASE}/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=ro&lat=${position.lat}&lon=${position.lng}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  return toResult((await response.json()) as NominatimPlace).label;
}
