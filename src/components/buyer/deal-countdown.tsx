"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ds/icon";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Figma: Countdown · Style=Inline, Urgent=False (GroupDealCard meta / pool price card).
 * "02z 06h 00m" when a day or more is left, "05h 12m 00s" below that. Ticks every second.
 */
export function DealCountdown({ closesAt, tone = "default" }: { closesAt: string; tone?: "default" | "inverse" }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, Math.floor((Date.parse(closesAt) - now) / 1000));
  const d = Math.floor(left / 86_400);
  const h = Math.floor((left % 86_400) / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  const parts: [number, string][] = d > 0 ? [[d, "z"], [h, "h"], [m, "m"]] : [[h, "h"], [m, "m"], [s, "s"]];
  const spoken = d > 0 ? `${d} zile ${h} ore ${m} minute` : `${h} ore ${m} minute`;
  const inverse = tone === "inverse";
  return (
    <span
      className={inverse ? "inline-flex shrink-0 items-center gap-1 text-text-inverse" : "inline-flex shrink-0 items-center gap-1 text-text-primary"}
      aria-label={`Se închide în ${spoken}`}
      suppressHydrationWarning
    >
      {inverse ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <circle cx="7" cy="7" r="5.2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M7 4.2V7.2L9 8.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ) : (
        <Icon name="clock-16" size={16} />
      )}
      {parts.map(([value, unit]) => (
        <span key={unit} className="inline-flex items-baseline gap-px" aria-hidden suppressHydrationWarning>
          <b className="title-sm" suppressHydrationWarning>
            {pad(value)}
          </b>
          <span className={inverse ? "label-sm text-text-inverse" : "label-sm text-text-secondary"}>{unit}</span>
        </span>
      ))}
    </span>
  );
}
