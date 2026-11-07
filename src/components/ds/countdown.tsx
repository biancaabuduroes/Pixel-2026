"use client";

import { useEffect, useState } from "react";
import { Icon } from "./icon";

/** Figma: Countdown · Style=Inline, Urgent=True (node 35:252). Clock icon + "00m 42s" in danger red. Reset it with a new `key`. */
export function Countdown({ seconds, onDone }: { seconds: number; onDone?: () => void }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) {
      onDone?.();
      return;
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, onDone]);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <span className="inline-flex items-center gap-1 text-text-danger" aria-live="off">
      <Icon name="clock-16-danger" size={16} />
      <span className="inline-flex items-baseline gap-px">
        <b className="title-sm">{mm}</b>
        <span className="label-sm">m</span>
      </span>
      <span className="inline-flex items-baseline gap-px">
        <b className="title-sm">{ss}</b>
        <span className="label-sm">s</span>
      </span>
    </span>
  );
}
