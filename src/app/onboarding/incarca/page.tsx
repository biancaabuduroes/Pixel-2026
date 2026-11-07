import { Suspense } from "react";
import { buyerAvailable } from "@/domain/wallet";
import { accountBalance } from "@/server/ledger";
import { db } from "@/lib/db";
import { currentUser } from "@/server/session";
import { TopUpForm } from "./top-up-form";

// Figma B1.5 Top up bunToken (optional) + B1.5a explainer sheet. Balance read from the ledger.
export default function TopUpPage() {
  return (
    <Suspense>
      <TopUp />
    </Suspense>
  );
}

async function TopUp() {
  const buyer = await currentUser("BUYER");
  const balance = buyer ? await accountBalance(db, buyerAvailable(buyer.id)) : 0;
  return <TopUpForm balanceBani={balance} signedIn={buyer !== null} />;
}
