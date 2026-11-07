"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const SPLASH_MS = 1500;

// Figma 53:1330 Splash (logo on white). Opens the welcome slides after a short pause or on tap.
export default function SplashPage() {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.replace("/onboarding/bun-venit"), SPLASH_MS);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <button
      type="button"
      onClick={() => router.replace("/onboarding/bun-venit")}
      className="mx-auto flex min-h-dvh w-full max-w-[430px] cursor-pointer items-center justify-center bg-bg-canvas px-page pt-6 pb-8"
      aria-label="BunDeals — continuă"
    >
      <Image src="/figma/bundeals-logo.png" alt="BunDeals — Better deals, together." width={240} height={80} priority unoptimized />
    </button>
  );
}
