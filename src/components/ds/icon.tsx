import Image from "next/image";
import { cn } from "cn";

/**
 * Icons exported from Figma (Icons page: outline, 24 grid, 1.75 stroke), stored in public/figma/
 * with their Figma colour baked in. Name = <icon>-<px size>[-<colour token>].
 */
export type FigmaIconName =
  | "users-96-brand" | "lock-96-brand" | "compass-96-brand"
  | "chevron-left-24" | "chevron-right-20" | "close-24" | "close-12"
  | "mail-20" | "clock-16-danger" | "lock-20" | "check-14-inverse" | "check-12-inverse" | "check-circle-20-success"
  | "store-20-success" | "wallet-20-deal" | "wallet-16-deal" | "wallet-20-inverse" | "wallet-20-secondary"
  | "info-24-primary" | "search-20" | "search-20-active" | "home-pin-28" | "location-16" | "location-32-brand"
  | "users-20-deal" | "compass-20" | "info-24"
  | "bag-24-brand" | "bag-56-brand" | "bag-150-brand";

export function Icon({ name, size, className, label }: { name: FigmaIconName; size: number; className?: string; label?: string }) {
  return (
    <Image
      src={`/figma/${name}.svg`}
      width={size}
      height={size}
      alt={label ?? ""}
      aria-hidden={label ? undefined : true}
      className={cn("shrink-0", className)}
      unoptimized
    />
  );
}
