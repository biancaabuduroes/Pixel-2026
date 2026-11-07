"use client";

import { useMemo, useState } from "react";
import { TextField } from "@/components/ds/text-field";
import { SummaryRow } from "@/components/ds/summary-row";
import { formatRon } from "@/domain/money";

/**
 * Client-only estimate: acquisition cost is not stored (no schema field).
 * Labelled clearly so it never looks like ledger data.
 */
export function MarginCalculator({
  unitsSold,
  unitSalePrice,
  commission,
}: {
  unitsSold: number;
  unitSalePrice: number;
  commission: number;
}) {
  const [costRon, setCostRon] = useState("");
  const costBani = useMemo(() => {
    const n = Number(costRon.replace(",", "."));
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.round(n * 100);
  }, [costRon]);

  const revenue = unitsSold * unitSalePrice;
  const costTotal = costBani === null ? null : costBani * unitsSold;
  const gross = costTotal === null ? null : revenue - costTotal;
  const net = gross === null ? null : gross - commission;
  const marginPct = gross !== null && revenue > 0 ? Math.round((gross * 100) / revenue) : null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-bg-surface p-5 shadow-card sm:p-6">
      <div>
        <h3 className="title-md text-text-primary">Marjă de profit (estimare)</h3>
        <p className="mt-1 body-sm text-text-secondary">Costul de achiziție nu se salvează. Calculezi local, doar pentru tine.</p>
      </div>
      <TextField
        label="Cost de achiziție / unitate (RON)"
        inputMode="decimal"
        placeholder="ex. 12,50"
        value={costRon}
        onChange={(e) => setCostRon(e.target.value)}
        helper={costBani === null && costRon ? "Introdu un număr valid" : undefined}
      />
      {costBani === null ? (
        <p className="body-sm text-text-secondary">Cost de achiziție necompletat — completează ca să vezi marja.</p>
      ) : (
        <div>
          <SummaryRow label="Venituri brute" value={formatRon(revenue)} />
          <SummaryRow label="Cost produse" value={formatRon(costTotal!)} />
          <SummaryRow label="Profit brut" value={formatRon(gross!)} />
          <SummaryRow label="Marjă brută" value={`${marginPct}%`} />
          <SummaryRow label="Comision BunDeals" value={`−${formatRon(commission)}`} />
          <SummaryRow label="Profit net estimat" value={formatRon(net!)} emphasis divider={false} />
        </div>
      )}
    </div>
  );
}
