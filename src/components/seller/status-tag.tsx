import { Tag } from "@/components/ds/tag";
import { SELLER_GROUP_STATUS_LABEL, type SellerGroupStatus } from "@/domain/seller";

const TONE: Record<SellerGroupStatus, "neutral" | "brand" | "deal" | "success" | "danger" | "info"> = {
  ACTIVE: "brand",
  TIER_UNLOCKED: "success",
  NEAR_TIER: "deal",
  BEST_PRICE: "success",
  WON: "success",
  CLOSED_BASE_PRICE: "neutral",
  NO_PARTICIPANTS: "neutral",
};

export function StatusTag({ status, closingSoon }: { status: SellerGroupStatus; closingSoon?: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Tag tone={TONE[status]}>{SELLER_GROUP_STATUS_LABEL[status]}</Tag>
      {closingSoon && <Tag tone="danger">Expiră în curând</Tag>}
    </span>
  );
}
