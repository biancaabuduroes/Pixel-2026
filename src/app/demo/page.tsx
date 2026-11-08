import type { Metadata } from "next";
import { DemoStage } from "@/components/demo/demo-stage";

export const metadata: Metadata = { title: "BunDeals · Demo", robots: { index: false } };

/**
 * Presentation page (branch demo-mode only): shows the real app inside a CSS phone frame
 * (buyer) or a browser window (seller). The app itself is embedded with an iframe, never copied.
 */
export default function DemoPage() {
  return <DemoStage />;
}
