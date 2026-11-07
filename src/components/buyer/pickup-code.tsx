import QRCode from "qrcode";

/**
 * The buyer's pickup code: a QR of the seller's confirm link (scanned with the phone camera)
 * plus the 6 digits as a fallback. Rendered on the server; the QR SVG has its own white
 * background so it stays scannable in dark mode.
 */
export async function PickupCode({ code, url }: { code: string; url: string }) {
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border p-4">
      <div className="w-48" aria-label="Pickup QR code" role="img" dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="font-mono text-2xl tracking-[0.3em]" aria-label="Pickup code">
        {code}
      </p>
      <p className="text-sm text-muted-foreground">Show this to the seller. It works once, only for this order.</p>
      {/* Demo convenience: lets the presenter "scan" on the same laptop. */}
      <a href={url} className="text-sm underline underline-offset-4">
        Open the seller&apos;s confirm page
      </a>
    </div>
  );
}
