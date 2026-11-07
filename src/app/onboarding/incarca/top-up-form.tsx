"use client";

import { useState, useTransition } from "react";
import { AmountTiles } from "@/components/ds/amount-tile";
import { BottomSheet } from "@/components/ds/bottom-sheet";
import { Icon } from "@/components/ds/icon";
import { InlineAlert } from "@/components/ds/inline-alert";
import { Timeline } from "@/components/ds/timeline";
import { OnboardingScreen, ScreenTitle } from "@/components/onboarding/onboarding-screen";
import { Button } from "@/components/ui/button";
import { stepNumber, TOP_UP_MIN_RON, TOP_UP_PRESETS, TOTAL_STEPS } from "@/lib/onboarding";
import { topUpAction } from "@/server/actions/buyer";
import { completeOnboardingAction } from "@/server/actions/onboarding";

const HOW_IT_WORKS = [
  { label: "Încarci bunToken cu cardul", caption: "Acum sau când intri într-un grup și nu ai destui.", state: "current" },
  { label: "Intri într-un grup", caption: "Blocăm bunToken cât prețul maxim. Nu se cheltuie încă.", state: "upcoming" },
  { label: "Ai reușit să cumperi la preț de grup!", caption: "Plătești prețul final. Diferența revine automat în portofel.", state: "upcoming" },
] as const;

// Figma 64:1385: big typed amount + one row of presets + Brand CTA. The keyboard in the frame
// is the phone's own number pad (inputMode="numeric").
export function TopUpForm() {
  const [value, setValue] = useState("100");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const amount = value === "" ? null : Number(value);
  const tooLow = amount !== null && amount < TOP_UP_MIN_RON;
  const valid = amount !== null && !tooLow;

  const topUp = () =>
    startTransition(async () => {
      if (!valid) return;
      setError(null);
      const result = await topUpAction({ topUpId: crypto.randomUUID(), amount: amount * 100 });
      if (result.ok) await completeOnboardingAction();
      else setError(result.reason === "UNAUTHORIZED" ? "Intră din nou în cont ca să încarci." : "Încărcarea nu a reușit. Încearcă din nou.");
    });

  return (
    <OnboardingScreen
      gap="gap-4"
      className="pb-6"
      nav={{
        backHref: "/onboarding/locatie",
        step: stepNumber("incarca"),
        totalSteps: TOTAL_STEPS,
        trailing: (
          <button
            type="button"
            aria-label="Cum funcționează bunToken?"
            onClick={() => setSheetOpen(true)}
            className="flex size-control-md items-center justify-center rounded-pill outline-none focus-visible:ring-2 focus-visible:ring-border-strong"
          >
            <Icon name="info-24-primary" size={24} />
          </button>
        ),
      }}
      footer={
        <div className="flex flex-col gap-2 pt-4">
          {error && (
            <p role="alert" className="text-center title-sm text-text-danger">
              {error}
            </p>
          )}
          <Button variant="brand" className="w-full text-text-inverse" disabled={!valid || pending} onClick={topUp}>
            Cumpără bunToken
          </Button>
          <div className="flex h-control-lg items-center justify-center">
            <Button variant="link" size="lg" onClick={() => startTransition(() => completeOnboardingAction())}>
              Mai târziu, când intru într-un grup
            </Button>
          </div>
          {/* Not in Figma: BUSINESS_LOGIC.md §9 requires top-ups to be labelled as demo money. */}
          <p className="text-center caption text-text-secondary">Mod demo: banii sunt simulați, nu se încarcă bani reali.</p>
        </div>
      }
    >
      <ScreenTitle>Încarcă bunToken</ScreenTitle>
      <label className="flex flex-1 cursor-text flex-col items-center justify-center gap-1.5">
        <span className="sr-only">Suma în RON</span>
        <input
          inputMode="numeric"
          autoComplete="off"
          aria-invalid={tooLow || undefined}
          aria-describedby="top-up-note"
          value={value}
          placeholder="0"
          size={Math.max(value.length, 1)}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 5))}
          className="bg-transparent text-center display-xl text-text-primary caret-text-primary outline-none placeholder:text-text-secondary"
        />
        <span id="top-up-note" className={tooLow ? "title-sm text-text-danger" : "body-sm text-text-secondary"} role={tooLow ? "alert" : undefined}>
          {tooLow ? `Suma minimă este ${TOP_UP_MIN_RON} RON` : `Minimum ${TOP_UP_MIN_RON} RON`}
        </span>
      </label>
      <AmountTiles size="sm" label="Sume rapide" amounts={TOP_UP_PRESETS} value={amount} onValueChange={(v) => setValue(String(v))} />

      <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen} title="Cum funcționează bunToken?">
        <p className="body-md text-text-secondary">bunToken e moneda din portofel cu care intri în grupuri. 1 bunToken valorează 1 RON.</p>
        <Timeline steps={HOW_IT_WORKS} />
        <InlineAlert tone="success" icon="check-circle-20-success" title="Dacă grupul nu se completează">
          Toți bunToken blocați îți revin integral, fără nicio taxă.
        </InlineAlert>
        <Button className="w-full" onClick={() => setSheetOpen(false)}>
          Am înțeles
        </Button>
      </BottomSheet>
    </OnboardingScreen>
  );
}
