import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, DM_Sans } from "next/font/google";
import "@/styles/globals.css";

// Figma typography (Typography/font-sans, font-display). The CSS variables are read by
// --font-sans / --font-display in src/styles/globals.css.
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin", "latin-ext"], weight: ["400", "600", "700"] });
const barlow = Barlow_Condensed({ variable: "--font-barlow", subsets: ["latin", "latin-ext"], weight: "800" });

export const metadata: Metadata = {
  title: "BunDeals",
  description: "Cumpără împreună, plătește mai puțin.",
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro" className={`${dmSans.variable} ${barlow.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
