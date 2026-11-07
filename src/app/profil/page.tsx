import Link from "next/link";
import { Suspense } from "react";
import { BuyerScreen } from "@/components/buyer/buyer-screen";
import { ProfileView } from "@/components/buyer/profile-view";
import { EmptyState } from "@/components/ds/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { profileData } from "@/server/buyer-queries";
import { currentUser } from "@/server/session";

/** B5.1 Profile: wallet balance + history, My purchases (orders) with pickup codes. */
export default function ProfilePage() {
  return (
    <Suspense fallback={<BuyerScreen>{null}</BuyerScreen>}>
      <Profile />
    </Suspense>
  );
}

async function Profile() {
  const buyer = await currentUser("BUYER");
  const data = buyer ? await profileData(buyer.id) : null;
  if (!data) {
    return (
      <BuyerScreen className="justify-center">
        <EmptyState icon="lock-96-brand" title="Intră în cont" body="Ca să-ți vezi portofelul și comenzile, intră în contul de cumpărător." />
        <Link href="/autentificare" className={buttonVariants({ className: "w-full" })}>
          Intră în cont
        </Link>
      </BuyerScreen>
    );
  }
  return <ProfileView {...data} demoMode={process.env.DEMO_MODE === "true"} />;
}
