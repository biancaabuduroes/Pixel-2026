import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SellerNav } from "@/components/seller/seller-nav";
import { Tag } from "@/components/ds/tag";
import { Button } from "@/components/ui/button";
import { storeWordmark } from "@/lib/store-brand";
import { logoutAction } from "@/server/actions/onboarding";
import { currentSeller } from "@/server/session";

export default function SellerLayout({ children }: LayoutProps<"/seller">) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-bg-subtle" />}>
      <SellerShell>{children}</SellerShell>
    </Suspense>
  );
}

async function SellerShell({ children }: { children: React.ReactNode }) {
  // Demo (decision 2026-11-08): no seller login page; the dashboard opens directly as the demo seller.
  const seller = await currentSeller();
  if (!seller) redirect("/autentificare"); // only outside DEMO_MODE
  const demo = process.env.DEMO_MODE === "true";

  return (
    <div className="min-h-dvh bg-bg-subtle">
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-6">
          <div className="flex min-w-0 items-center gap-5">
            <Link href="/seller" className="shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-border-strong">
              <Image src="/figma/bundeals-logo.png" alt="BunDeals" width={120} height={40} priority unoptimized />
            </Link>
            <SellerNav className="hidden md:flex" />
          </div>
          <div className="flex items-center gap-3">
            {storeWordmark(seller.name) ? (
              // Seller brand (src/lib/store-brand.ts), e.g. the Penny wordmark.
              <Image src={storeWordmark(seller.name)!} alt={seller.name} width={80} height={28} unoptimized className="h-7 w-auto rounded-xs" />
            ) : (
              <span className="hidden label-md text-text-secondary sm:inline">{seller.name}</span>
            )}
            {demo && <Tag tone="info">Mod demo</Tag>}
            {!demo && (
              <form action={logoutAction}>
                <Button type="submit" variant="tertiary" size="sm">
                  Ieși
                </Button>
              </form>
            )}
          </div>
        </div>
        <div className="border-t border-border-subtle px-4 py-2 md:hidden">
          <SellerNav />
        </div>
      </header>
      <div className="mx-auto max-w-[1280px] px-6 py-8 md:py-10">{children}</div>
    </div>
  );
}
