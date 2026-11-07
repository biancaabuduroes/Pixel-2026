"use client";

import { Field } from "@base-ui/react/field";
import { OTPField } from "@base-ui/react/otp-field";

/**
 * Figma: OTPInput (node 34:305). 6 cells 48×56, display font; the active cell has a 2px black
 * border. Calls onComplete when all 6 digits are entered.
 */
export function OtpInput({ value, onValueChange, onComplete }: { value: string; onValueChange: (value: string) => void; onComplete: (value: string) => void }) {
  return (
    <Field.Root>
      {/* Base UI labels the first cell from the field label; the others get "Cifra n". */}
      <Field.Label className="sr-only">Cod de verificare</Field.Label>
      <OTPField.Root
      length={6}
      value={value}
      onValueChange={onValueChange}
      onValueComplete={onComplete}
      inputMode="numeric"
      autoComplete="one-time-code"
      className="flex items-center justify-center gap-2"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <OTPField.Input
          key={i}
          aria-label={`Cifra ${i + 1}`}
          className="h-control-lg w-otp-cell rounded-sm border border-border-control bg-bg-surface text-center display-md text-text-primary outline-none focus:border-2 focus:border-border-strong"
        />
      ))}
      </OTPField.Root>
    </Field.Root>
  );
}
