import { DEMO_PHONE } from "@/lib/onboarding";
import { PhoneForm } from "./phone-form";

/** Phone step. In DEMO_MODE the demo number is prefilled (any 9-digit number still works). */
export default function PhonePage() {
  return <PhoneForm initialPhone={process.env.DEMO_MODE === "true" ? DEMO_PHONE : ""} />;
}
