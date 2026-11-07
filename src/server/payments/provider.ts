
/** Where top-up money comes from. Stripe test mode (P1) would be a second implementation. */
export interface PaymentProvider {
  /** Must be idempotent for the same `reference`. */
  charge(input: { amount: number; reference: string }): Promise<{ ok: true } | { ok: false; reason: string }>;
}

/** Demo money (BL §9): every charge succeeds. Clearly labelled as simulated in the UI. */
export const simulatedProvider: PaymentProvider = {
  async charge() {
    return { ok: true };
  },
};
