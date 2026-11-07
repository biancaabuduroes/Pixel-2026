"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

const LINKS = [
  { href: "/seller", label: "Dashboard", match: (p: string) => p === "/seller" },
  { href: "/seller/grupuri", label: "Grupuri", match: (p: string) => p.startsWith("/seller/grupuri") },
  { href: "/seller/pickup", label: "Ridicări", match: (p: string) => p.startsWith("/seller/pickup") },
] as const;

export function SellerNav({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={cn("flex items-center gap-1", className)} aria-label="Navigare vânzător">
      {LINKS.map((link) => {
        const active = link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-pill px-3.5 py-2 label-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-border-strong",
              active ? "bg-bg-action text-text-inverse" : "text-text-secondary hover:bg-bg-muted hover:text-text-primary",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
