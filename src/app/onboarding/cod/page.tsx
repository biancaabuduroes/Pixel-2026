import { Suspense } from "react";
import { CodeForm } from "./code-form";

// Figma B1.2b Sign up · one-time code. The ?tel= value only drives the masked number shown.
export default function CodePage({ searchParams }: PageProps<"/onboarding/cod">) {
  return (
    <Suspense>
      <CodeForm searchParams={searchParams} />
    </Suspense>
  );
}
