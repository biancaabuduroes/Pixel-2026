import Image from "next/image";
import { cn } from "cn";
import { Icon } from "./icon";

/**
 * Product photography (one treatment everywhere): square studio photos on #FFF1EC
 * (= --bg-brand-soft) shown with object-fit: contain on the same colour, so any box shape blends.
 * Files are pre-sized WebP in public/products: <id>.webp (800px) and <id>-thumb.webp (160px),
 * made with scripts/prepare-product-image.sh. No photo → the Figma bag icon (never a stand-in photo).
 */
export function ProductImage({
  src,
  alt,
  variant = "full",
  iconSize = 56,
  priority = false,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  /** "thumb" loads the 160px file (list thumbnails ≤ 80px). */
  variant?: "full" | "thumb";
  /** Fallback bag icon size when there is no photo. */
  iconSize?: number;
  /** Above-the-fold hero only. */
  priority?: boolean;
  className?: string;
}) {
  const file = src && variant === "thumb" ? src.replace(/\.webp$/, "-thumb.webp") : src;
  return (
    <div className={cn("relative overflow-hidden bg-bg-brand-soft", className)}>
      {file ? (
        // Pre-optimized static WebP: served as is (no image-optimization quota).
        <Image src={file} alt={alt} fill unoptimized priority={priority} loading={priority ? undefined : "lazy"} className="object-contain" />
      ) : (
        <div className="flex size-full items-center justify-center" role="img" aria-label={alt}>
          <Icon name={iconSize >= 100 ? "bag-150-brand" : iconSize <= 24 ? "bag-24-brand" : "bag-56-brand"} size={iconSize} />
        </div>
      )}
    </div>
  );
}
