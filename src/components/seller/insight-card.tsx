"use client";

import { useState } from "react";
import { Tag } from "@/components/ds/tag";
import { INSIGHT_CATEGORY_LABEL, type InsightCategory, type SellerInsight } from "@/domain/seller";

const TONE: Record<InsightCategory, "brand" | "deal" | "success" | "danger" | "info"> = {
  PERFORMANCE: "success",
  OPPORTUNITY: "deal",
  RECOMMENDATION: "info",
  WARNING: "danger",
};

export function InsightCard({ insight }: { insight: SellerInsight }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      className="flex w-full flex-col gap-2 rounded-lg border border-border-default bg-bg-surface p-4 text-left shadow-card outline-none focus-visible:ring-2 focus-visible:ring-border-strong"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Tag tone={TONE[insight.category]}>{INSIGHT_CATEGORY_LABEL[insight.category]}</Tag>
        <span className="caption text-text-secondary">{insight.period}</span>
      </div>
      <p className="body-md text-text-primary">{insight.text}</p>
      {open && (
        <p className="body-sm text-text-secondary">
          Metrică: <b className="text-text-primary">{insight.metric}</b>
        </p>
      )}
    </button>
  );
}
