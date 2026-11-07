"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRon } from "@/domain/money";
import { confirmPickupAction } from "@/server/actions/seller";

type Result = Awaited<ReturnType<typeof confirmPickupAction>>;

const MESSAGES: Record<Extract<Result, { ok: false }>["reason"], string> = {
  WRONG_CODE: "Wrong code. Check it with the buyer.",
  LOCKED: "Too many wrong codes. Try again in 15 minutes.",
  NOT_AWAITING_PICKUP: "This order is already collected.",
  NOT_FOUND: "Order not found.",
  UNAUTHORIZED: "Switch to the seller account first.",
  INVALID_INPUT: "Enter the 6-digit code.",
};

/** Seller confirms one pickup. The code is pre-filled when the buyer's QR was scanned. */
export function PickupCodeForm({ commitmentId, defaultCode }: { commitmentId: string; defaultCode?: string }) {
  const [state, action, pending] = useActionState(
    (_: Result | null, form: FormData) => confirmPickupAction({ commitmentId, code: String(form.get("code") ?? "") }),
    null,
  );

  if (state?.ok) {
    return (
      <p role="status" className="font-medium">
        Collected ✓ You receive {formatRon(state.sellerAmount)} (commission {formatRon(state.commission)}).
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
          placeholder="6-digit code"
          aria-label="Pickup code"
          className="font-mono tracking-widest"
          required
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Checking…" : "Confirm pickup"}
        </Button>
      </div>
      {state && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {MESSAGES[state.reason]}
        </p>
      )}
    </form>
  );
}
