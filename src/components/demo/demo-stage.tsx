"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { SegmentedControl } from "@/components/ds/segmented-control";
import { Button, buttonVariants } from "@/components/ui/button";

/**
 * Buyer = this deployment's own app (same origin, so the session and onboarding cookies work in
 * the iframe). Seller = the seller dashboard preview, which only exists on feat/seller-dashboard.
 */
const EXPERIENCES = {
  buyer: { label: "Buyer", src: "/", device: "phone" },
  seller: { label: "Seller", src: "https://pixel-2026-git-feat-seller-dashboard-bun-deals.vercel.app/seller/dashboard", device: "desktop" },
} as const;
type Experience = keyof typeof EXPERIENCES;

// Natural sizes (CSS px): iPhone 14-class screen 390×844 inside a 12px bezel; a 1280×800 desktop window.
const PHONE = { width: 390 + 24, height: 844 + 24 };
const DESKTOP = { width: 1280, height: 800 + 40 };
const BOTTOM_SPACE = 48; // footer below the device

/** Scales a fixed-size device to fit the available area (never above 100%). */
function useFitScale(ref: React.RefObject<HTMLElement | null>, size: { width: number; height: number }) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Fit the width of the stage and the screen height left below the header.
    const update = () => {
      const width = el.clientWidth - 32; // stage padding (px-page on both sides)
      const height = window.innerHeight - el.getBoundingClientRect().top - BOTTOM_SPACE;
      setScale(Math.max(0.3, Math.min(1, width / size.width, height / size.height)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [ref, size]);
  return scale;
}

export function DemoStage() {
  const [experience, setExperience] = useState<Experience>("buyer");
  const current = EXPERIENCES[experience];
  const size = current.device === "phone" ? PHONE : DESKTOP;
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const scale = useFitScale(stageRef, size);

  /** Full screen without the device frame; falls back to a new tab where the Fullscreen API is missing (iOS Safari). */
  function fullScreen() {
    const iframe = frameRef.current;
    if (iframe?.requestFullscreen) iframe.requestFullscreen().catch(() => window.open(current.src, "_blank", "noopener"));
    else window.open(current.src, "_blank", "noopener");
  }

  return (
    <div className="flex min-h-dvh flex-col items-center bg-bg-subtle">
      <header className="flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-3 px-page py-4">
        <Image src="/figma/bundeals-logo.png" alt="BunDeals" width={120} height={40} priority unoptimized />
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-48">
            <SegmentedControl
              label="Experiență"
              options={(Object.keys(EXPERIENCES) as Experience[]).map((value) => ({ value, label: EXPERIENCES[value].label }))}
              value={experience}
              onValueChange={setExperience}
            />
          </div>
          <Button variant="secondary" size="md" onClick={fullScreen}>
            Full screen
          </Button>
          <a href={current.src} target="_blank" rel="noopener" className={buttonVariants({ variant: "link", size: "md", className: "px-2" })}>
            New tab
          </a>
        </div>
      </header>

      <main ref={stageRef} className="flex w-full max-w-[1280px] flex-1 justify-center px-page pb-6">
        {/* The scaled device keeps its natural layout size, so the wrapper reserves the scaled size. */}
        <div style={{ width: size.width * scale, height: size.height * scale }}>
          <div style={{ width: size.width, height: size.height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            {current.device === "phone" ? (
              <PhoneFrame>
                <iframe key={experience} ref={frameRef} title="BunDeals · Buyer" src={current.src} allow="fullscreen" className="size-full border-0 bg-bg-canvas" />
              </PhoneFrame>
            ) : (
              <BrowserFrame url={current.src}>
                <iframe key={experience} ref={frameRef} title="BunDeals · Seller dashboard" src={current.src} allow="fullscreen" className="size-full border-0 bg-bg-canvas" />
              </BrowserFrame>
            )}
          </div>
        </div>
      </main>

      <footer className="pb-4 caption text-text-secondary">Demo mode · demo money only</footer>
    </div>
  );
}

/** iPhone-style frame in CSS: black bezel, rounded screen, status bar with Dynamic Island, home indicator. */
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative size-full rounded-[56px] bg-bg-inverse p-3 shadow-raised ring-1 ring-border-strong/40">
      {/* Side buttons */}
      <span aria-hidden className="absolute top-[180px] -left-[3px] h-16 w-[3px] rounded-l-xs bg-bg-inverse" />
      <span aria-hidden className="absolute top-[260px] -left-[3px] h-16 w-[3px] rounded-l-xs bg-bg-inverse" />
      <span aria-hidden className="absolute top-[220px] -right-[3px] h-24 w-[3px] rounded-r-xs bg-bg-inverse" />
      <div className="relative flex size-full flex-col overflow-hidden rounded-[44px] bg-bg-canvas">
        <div aria-hidden className="relative flex h-[47px] shrink-0 items-center justify-between px-8 pt-1">
          <span className="title-md text-text-primary">9:41</span>
          <span className="absolute top-[11px] left-1/2 h-[34px] w-[124px] -translate-x-1/2 rounded-pill bg-bg-inverse" />
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-4 rounded-xs bg-bg-inverse" />
            <span className="h-3 w-6 rounded-xs border-2 border-border-strong" />
          </span>
        </div>
        <div className="min-h-0 flex-1">{children}</div>
        <span aria-hidden className="pointer-events-none absolute bottom-2 left-1/2 h-[5px] w-[134px] -translate-x-1/2 rounded-pill bg-bg-inverse" />
      </div>
    </div>
  );
}

/** Desktop browser window for the seller dashboard (desktop web). */
function BrowserFrame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="flex size-full flex-col overflow-hidden rounded-lg border border-border-default bg-bg-surface shadow-raised">
      <div className="flex h-10 shrink-0 items-center gap-3 border-b border-border-default bg-bg-muted px-4">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-3 rounded-pill bg-bg-danger" />
          <span className="size-3 rounded-pill bg-bg-deal" />
          <span className="size-3 rounded-pill bg-bg-success-strong" />
        </span>
        <span className="flex-1 truncate rounded-pill bg-bg-surface px-4 py-1 body-sm text-text-secondary">{url.replace(/^https?:\/\//, "")}</span>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
