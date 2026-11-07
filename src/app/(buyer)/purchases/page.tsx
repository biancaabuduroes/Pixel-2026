import { redirect } from "next/navigation";

/** Old "My purchases" URL: orders and pickup codes now live on the Profile screen (Figma B5.1). */
export default function PurchasesPage() {
  redirect("/profil");
}
