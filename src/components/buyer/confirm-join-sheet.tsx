"use client";

import { BottomSheet } from "@/components/ds/bottom-sheet";
import { InlineAlert } from "@/components/ds/inline-alert";
import { SummaryRow } from "@/components/ds/summary-row";
import { Button } from "@/components/ui/button";
import { formatRon } from "@/domain/money";
import { formatToken, units } from "@/lib/format";

/** Shown before joinGroupAction. Amounts are the same preview the pool bar uses; the server recalculates. */
export function ConfirmJoinSheet({
  open,
  onOpenChange,
  productName,
  storeName,
  quantity,
  unitPrice,
  lockAmount,
  tierUnlocked,
  joinUnlocksTier,
  pending,
  error,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  storeName: string;
  quantity: number;
  unitPrice: number;
  lockAmount: number;
  /** BL §5: the group has already unlocked its first lower tier. */
  tierUnlocked: boolean;
  /** This join's quantity would push the group total across that threshold. */
  joinUnlocksTier: boolean;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
}) {
  const cannotCancel = tierUnlocked || joinUnlocksTier;

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Ești sigur?" header="left">
      <p className="body-md text-text-secondary">
        {productName}. Intri cu {units(quantity)}. Banii se blochează acum și se plătesc la închiderea grupului.
      </p>

      <section className="flex flex-col">
        <SummaryRow label="Preț maxim / unitate" value={formatRon(unitPrice)} />
        <SummaryRow label="Blochezi acum" value={formatToken(lockAmount)} />
        <SummaryRow label="Plătești la închidere" value="Prețul final, același sau mai mic" divider={false} />
      </section>

      <p className="body-sm text-text-secondary">
        Diferența îți revine automat în portofel. Ridici din {storeName} după închidere, cu codul din Profil.
      </p>

      {cannotCancel ? (
        <InlineAlert tone="danger" icon="info-24" title="Nu mai poți renunța">
          {tierUnlocked
            ? "Grupul a deblocat deja o reducere. După ce intri nu mai poți ieși, iar prețul nu mai poate crește."
            : "Cantitatea ta deblochează prima reducere. După ce intri nu mai poți ieși, iar prețul nu mai poate crește."}
        </InlineAlert>
      ) : (
        <InlineAlert tone="info" icon="info-24" title="Poți renunța">
          Din Profil, cât timp grupul e deschis și prima reducere nu e deblocată. Primești înapoi toată suma blocată.
        </InlineAlert>
      )}

      {error && (
        <InlineAlert tone="danger" icon="info-24">
          {error}
        </InlineAlert>
      )}

      <Button className="w-full" disabled={pending} onClick={onConfirm}>
        {pending ? "Se blochează…" : "Da, intră în grup"}
      </Button>
      <Button variant="secondary" className="w-full" disabled={pending} onClick={() => onOpenChange(false)}>
        Nu acum
      </Button>
    </BottomSheet>
  );
}
