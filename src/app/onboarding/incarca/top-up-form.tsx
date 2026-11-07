"use client";

import { useState, useTransition } from "react";
import { AmountTiles } from "@/components/ds/amount-tile";
import { BottomSheet } from "@/components/ds/bottom-sheet";
import { Icon } from "@/components/ds/icon";
import { InlineAlert } from "@/components/ds/inline-alert";
import { ListRow } from "@/components/ds/list-row";
import { Tag } from "@/components/ds/tag";
import { TextField } from "@/components/ds/text-field";
import { Timeline } from "@/components/ds/timeline";
import { OnboardingScreen, ScreenTitle } from "@/components/onboarding/onboarding-screen";
import { Button } from "@/components/ui/button";
import { formatRon } from "@/domain/money";
import { stepNumber, TOP_UP_MIN_RON, TOP_UP_PRESETS, TOTAL_STEPS } from "@/lib/onboarding";
import { topUpAction } from "@/server/actions/buyer";
import { completeOnboardingAction } from "@/server/actions/onboarding";

const HOW_IT_WORKS = [
  { label: "Încarci bunToken cu cardul", caption: "Acum sau când intri într-un grup și nu ai destui.", state: "current" },
  { label: "Intri într-un grup", caption: "Blocăm bunToken cât prețul maxim. Nu se cheltuie încă.", state: "upcoming" },
  { label: "Ai reușit să cumperi la preț de grup!", caption: "Plătești prețul final. Diferența revine automat în portofel.", state: "upcoming" },
] as const;

export function TopUpForm({ balanceBani, signedIn }: { balanceBani: number; signedIn: boolean }) {
  const [preset, setPreset] = useState<number | null>(100);
  const [custom, setCustom] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const customRon = custom.trim() === "" ? null : Number(custom);
  const customTooLow = customRon !== null && (!Number.isInteger(customRon) || customRon < TOP_UP_MIN_RON);
  const amount = customRon !== null ? (customTooLow ? null : customRon) : preset;
  const tokens = formatRon(balanceBani).replace(" RON", "");

  const topUp = () =>
    startTransition(async () => {
      if (amount === null) return;
      setError(null);
      const result = await topUpAction({ topUpId: crypto.randomUUID(), amount: amount * 100 });
      if (result.ok) await completeOnboardingAction();
      else setError("Încărcarea nu a reușit. Încearcă din nou.");
    });

  return (
    <OnboardingScreen
      nav={{ backHref: "/onboarding/locatie", step: stepNumber("incarca"), totalSteps: TOTAL_STEPS }}
      footer={
        <>
          {error && (
            <p role="alert" className="text-center title-sm text-text-danger">
              {error}
            </p>
          )}
          <Button className="w-full" disabled={amount === null || !signedIn || pending} onClick={topUp}>
            <Icon name={amount === null ? "wallet-20-secondary" : "wallet-20-inverse"} size={20} />
            {amount === null ? "Alege o sumă" : `Încarcă ${amount} bunToken · ${amount} RON`}
          </Button>
          <div className="flex h-control-lg items-center justify-center">
            <Button variant="link" size="lg" onClick={() => startTransition(() => completeOnboardingAction())}>
              Mai târziu, când intru într-un grup
            </Button>
          </div>
          {/* Not in Figma: BUSINESS_LOGIC.md §9 requires top-ups to be labelled as demo money. */}
          <p className="text-center caption text-text-secondary">Mod demo: banii sunt simulați, nu se încarcă bani reali.</p>
        </>
      }
    >
      <ScreenTitle>Încarcă bunToken</ScreenTitle>
      <div className="flex w-full items-center justify-between gap-3 rounded-lg bg-bg-subtle px-4 py-3">
        <div className="flex flex-col">
          <span className="label-sm text-text-secondary">Sold actual</span>
          <span className="title-lg text-text-primary">{tokens} bunToken</span>
        </div>
        <Tag tone="deal" icon="wallet-16-deal">
          1 bunToken = 1 RON
        </Tag>
      </div>
      <AmountTiles
        label="Sume rapide"
        amounts={TOP_UP_PRESETS}
        value={customRon === null ? preset : null}
        onValueChange={(value) => {
          setPreset(value);
          setCustom("");
        }}
      />
      <TextField
        label="Altă sumă"
        placeholder="Introdu suma"
        suffix="RON"
        inputMode="numeric"
        value={custom}
        onChange={(e) => setCustom(e.target.value.replace(/\D/g, ""))}
        helper={`Minimum ${TOP_UP_MIN_RON} RON`}
        error={customTooLow ? `Suma minimă este ${TOP_UP_MIN_RON} RON` : undefined}
      />
      <ListRow icon="info-24" title="Cum funcționează bunToken?" subtitle="Blocare, preț final, diferența înapoi" onClick={() => setSheetOpen(true)} />

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
