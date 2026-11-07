import Image from "next/image";
import { Icon } from "@/components/ds/icon";
import { Tag } from "@/components/ds/tag";

/**
 * Figma B1.4 "Map" (mock, decision 2026-11-07): a static drawing, no map service or geolocation.
 * Pin offsets are Figma's, measured from the map's centre so it stays centred at any width.
 */
const STORES = [
  { dx: -14, dy: 6.5, inside: true },
  { dx: 39.2, dy: -34.75, inside: true },
  { dx: 32.75, dy: 57.46, inside: true },
  { dx: -53.5, dy: -91.93, inside: false },
  { dx: 112.25, dy: -20.97, inside: false },
];

export function MapMock({ radiusKm }: { radiusKm: number }) {
  return (
    <div className="relative h-50 w-full overflow-hidden rounded-lg border border-border-default bg-bg-subtle" role="img" aria-label={`Hartă: magazine partenere pe o rază de ${radiusKm} km`}>
      <Image src="/figma/map-radius.png" alt="" width={150} height={150} className="absolute top-6 left-[calc(50%-75px)]" unoptimized />
      {STORES.map((s, i) => (
        <span
          key={i}
          className={`absolute flex size-8 items-center justify-center rounded-pill border-2 border-border-surface ${s.inside ? "bg-bg-action" : "bg-bg-strong"}`}
          style={{ left: `calc(50% + ${s.dx - 16}px)`, top: `${84 + s.dy}px` }}
        >
          <Icon name="store-16-inverse" size={16} />
        </span>
      ))}
      <span className="absolute top-[85px] left-[calc(50%-14px)]">
        <Icon name="home-pin-28" size={28} />
      </span>
      <Tag tone="surface" icon="location-16" className="absolute top-[167px] left-[11px]">
        Rază {radiusKm} km
      </Tag>
    </div>
  );
}
