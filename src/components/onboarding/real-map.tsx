"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ds/icon";
import { Tag } from "@/components/ds/tag";

export type LatLng = { lat: number; lng: number };

const HEIGHT = 200; // Figma B1.4 Map: 358×200, radius 16, 1px border-default
const CIRCLE = 150; // Figma radius circle diameter (px)
const METRES_PER_DEGREE = 111_320;

/**
 * Figma B1.4 "Map" (41:589) as a real OpenStreetMap map (embed: no package, no API key).
 * The circle is always Figma's 150px; the map area is sized so 150px = the chosen diameter, so the
 * radius is to scale. The map is static, so the circle and pin stay over the address.
 */
export function RealMap({ center, radiusKm }: { center: LatLng; radiusKm: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const metresPerPx = (radiusKm * 2000) / CIRCLE;
  const cos = Math.cos((center.lat * Math.PI) / 180);
  const halfLat = ((HEIGHT / 2) * metresPerPx) / METRES_PER_DEGREE;
  const halfLng = (((width ?? 358) / 2) * metresPerPx) / (METRES_PER_DEGREE * cos);
  const bbox = [center.lng - halfLng, center.lat - halfLat, center.lng + halfLng, center.lat + halfLat].map((n) => n.toFixed(6)).join(",");

  return (
    <div ref={ref} className="relative h-50 w-full overflow-hidden rounded-lg border border-border-default bg-bg-subtle">
      {width !== null && (
        <iframe
          title={`Hartă: rază de ${radiusKm} km în jurul adresei tale`}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`}
          className="pointer-events-none absolute inset-0 size-full border-0"
          loading="lazy"
          tabIndex={-1}
        />
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-pill border-2 border-dashed border-border-brand bg-bg-brand-soft/40"
        style={{ width: CIRCLE, height: CIRCLE }}
      />
      <span aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Icon name="home-pin-28" size={28} />
      </span>
      {/* Top-left (Figma: bottom-left) so OpenStreetMap's required attribution stays readable. */}
      <Tag tone="surface" icon="location-16" className="absolute top-[11px] left-[11px]">
        Rază {radiusKm} km
      </Tag>
    </div>
  );
}
