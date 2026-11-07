import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PoolView } from "@/components/buyer/pool-view";
import { BuyerScreen } from "@/components/buyer/buyer-screen";
import { productData } from "@/server/buyer-queries";
import { currentUser } from "@/server/session";

/** B3.3 Pool page: product detail, tier ladder, open groups, join. */
export default function ProductPage(props: PageProps<"/produs/[id]">) {
  return (
    <Suspense fallback={<BuyerScreen>{null}</BuyerScreen>}>
      <Pool params={props.params} />
    </Suspense>
  );
}

async function Pool({ params }: { params: PageProps<"/produs/[id]">["params"] }) {
  const [{ id }, buyer] = await Promise.all([params, currentUser("BUYER")]);
  const data = await productData(id, buyer?.id ?? null);
  if (!data || data.product.status !== "ACTIVE") notFound();
  return <PoolView {...data} signedIn={buyer !== null} />;
}
