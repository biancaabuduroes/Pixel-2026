import Image from "next/image";
import { cn } from "cn";
import { Icon } from "@/components/ds/icon";

/** Supermarket logo (square, rounded) with the store icon as fallback when the seller has no logo. */
export function StoreLogo({ logo, name, size, className }: { logo: string | null; name: string; size: number; className?: string }) {
  if (logo) return <Image src={logo} alt={name} width={size} height={size} unoptimized className={cn("shrink-0 rounded-md object-cover", className)} />;
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-md bg-bg-brand-soft", className)} style={{ width: size, height: size }}>
      <Icon name="store-20-success" size={Math.round(size / 2)} />
    </span>
  );
}
