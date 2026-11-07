"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRon } from "@/domain/money";
import { confirmPickupAction } from "@/server/actions/seller";

type Result = Awaited<ReturnType<typeof confirmPickupAction>>;

const MESSAGES: Record<Extract<Result, { ok: false }>["reason"], string> = {
  WRONG_CODE: "Cod greșit. Verifică-l cu cumpărătorul.",
  LOCKED: "Prea multe coduri greșite. Încearcă din nou peste 15 minute.",
  NOT_AWAITING_PICKUP: "Comanda a fost deja ridicată.",
  NOT_FOUND: "Comanda nu a fost găsită.",
  UNAUTHORIZED: "Intră mai întâi în contul de vânzător.",
  INVALID_INPUT: "Introdu codul de 6 cifre.",
};

/** Seller confirms one pickup. The code is pre-filled when the buyer's QR was scanned. */
export function PickupCodeForm({ commitmentId, defaultCode }: { commitmentId: string; defaultCode?: string }) {
  const [state, action, pending] = useActionState(
    (_: Result | null, form: FormData) => confirmPickupAction({ commitmentId, code: String(form.get("code") ?? "") }),
    null,
  );

  if (state?.ok) {
    return (
      <p role="status" className="label-md">
        Ridicat ✓ Primești {formatRon(state.sellerAmount)} (comision {formatRon(state.commission)}).
      </p>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          name="code"
          defaultValue={defaultCode}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          placeholder="Cod de 6 cifre"
          aria-label="Cod de ridicare"
          className="label-lg tracking-widest"
          required
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Se verifică…" : "Confirmă"}
        </Button>
      </div>
      {state && !state.ok && (
        <p role="alert" className="body-sm text-destructive">
          {MESSAGES[state.reason]}
        </p>
      )}
    </form>
  );
}
