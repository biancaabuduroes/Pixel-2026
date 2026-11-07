import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Tag } from "@/components/ds/tag";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/actions/onboarding";
import { currentProfile, currentUser } from "@/server/session";

export default function SellerLayout({ children }: LayoutProps<"/seller">) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-bg-subtle" />}>
      <SellerShell>{children}</SellerShell>
    </Suspense>
  );
}

async function SellerShell({ children }: { children: React.ReactNode }) {
  const seller = await currentUser("SELLER");
  if (!seller) redirect("/autentificare");
  const profile = await currentProfile();

  return (
    <div className="min-h-dvh bg-bg-subtle">
      <header className="border-b border-border-default bg-bg-surface">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-6">
          <div className="flex min-w-0 items-center gap-6">
            <Link href="/seller" className="shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-border-strong">
              <Image src="/figma/bundeals-logo.png" alt="BunDeals" width={120} height={40} priority unoptimized />
            </Link>
            <nav className="hidden items-center gap-1 md:flex" aria-label="Navigare vânzător">
              <NavLink href="/seller">Dashboard</NavLink>
              <NavLink href="/seller/grupuri">Grupuri</NavLink>
              <NavLink href="/seller/pickup">Ridicări</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden label-md text-text-primary sm:inline">{profile?.name ?? "Vânzător"}</span>
            <Tag tone="info">Mod demo</Tag>
            <form action={logoutAction}>
              <Button type="submit" variant="tertiary" size="sm">
                Ieși
              </Button>
            </form>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-border-subtle px-4 py-2 md:hidden" aria-label="Navigare vânzător mobil">
          <NavLink href="/seller">Dashboard</NavLink>
          <NavLink href="/seller/grupuri">Grupuri</NavLink>
          <NavLink href="/seller/pickup">Ridicări</NavLink>
        </nav>
      </header>
      <div className="mx-auto max-w-[1280px] px-6 py-8">{children}</div>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-pill px-3 py-2 label-md text-text-primary outline-none hover:bg-bg-muted focus-visible:ring-2 focus-visible:ring-border-strong"
    >
      {children}
    </Link>
  );
}
