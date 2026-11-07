"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { InlineAlert } from "@/components/ds/inline-alert";
import { SegmentedControl } from "@/components/ds/segmented-control";
import { Slider } from "@/components/ds/slider";
import { OnboardingScreen, ScreenLead, ScreenTitle } from "@/components/onboarding/onboarding-screen";
import { Button } from "@/components/ui/button";
import { formatRon } from "@/domain/money";
import { BUDGET, stepNumber, TOTAL_STEPS } from "@/lib/onboarding";
import { savePreferencesAction } from "@/server/actions/onboarding";

type Period = keyof typeof BUDGET;
const PERIODS = [
  { value: "week", label: BUDGET.week.label },
  { value: "month", label: BUDGET.month.label },
] as const;
const ron = (value: number) => formatRon(value * 100);

// Figma B1.3c Shopping budget (weekly + monthly states).
export default function BudgetPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("week");
  const [amounts, setAmounts] = useState({ week: BUDGET.week.initial, month: BUDGET.month.initial });
  const [pending, startTransition] = useTransition();
  const config = BUDGET[period];
  const amount = amounts[period];

  const next = () =>
    startTransition(async () => {
      await savePreferencesAction({ budgetPeriod: period, budgetBani: amount * 100 });
      router.push("/onboarding/locatie");
    });

  return (
    <OnboardingScreen
      nav={{ backHref: "/onboarding/preferinte", step: stepNumber("buget"), totalSteps: TOTAL_STEPS }}
      footer={
        <>
          <Button className="w-full" disabled={pending} onClick={next}>
            Continuă
          </Button>
          <p className="text-center caption text-text-secondary">Bugetul e doar pentru recomandări. Nu îl vede nimeni altcineva.</p>
        </>
      }
    >
      <ScreenTitle>Cât cheltui pe cumpărături?</ScreenTitle>
      <ScreenLead>Îți arătăm grupurile care încap în buget, ca să economisești fără să depășești.</ScreenLead>
      <SegmentedControl label="Perioada bugetului" options={PERIODS} value={period} onValueChange={setPeriod} />
      <div className="flex flex-col items-center pt-2 text-center">
        <p className="display-xl text-text-primary" aria-live="polite">
          {ron(amount)}
        </p>
        <p className="body-md text-text-secondary">{config.caption}, pentru toate cumpărăturile</p>
      </div>
      <Slider
        label="Buget"
        value={amount}
        min={config.min}
        max={config.max}
        step={config.step}
        minLabel={ron(config.min)}
        maxLabel={`${ron(config.max).replace(" RON", "")}+ RON`}
        onValueChange={(value) => setAmounts({ ...amounts, [period]: value })}
      />
      <InlineAlert tone="deal" icon="wallet-20-deal">
        Îți arătăm întâi grupurile care încap în {ron(amount)} {config.caption}.
      </InlineAlert>
    </OnboardingScreen>
  );
}
