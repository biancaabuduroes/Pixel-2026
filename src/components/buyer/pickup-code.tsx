import QRCode from "qrcode";

/**
 * The buyer's pickup code: a QR of the seller's confirm link (scanned with the phone camera)
 * plus the 6 digits as a fallback. Rendered on the server; the QR SVG has its own white
 * background so it stays scannable in dark mode.
 */
export async function PickupCode({ code, url }: { code: string; url: string }) {
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border p-4">
      <div className="w-48" aria-label="Cod QR de ridicare" role="img" dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="display-md tracking-[0.3em]" aria-label="Cod de ridicare">
        {code}
      </p>
      <p className="body-sm text-muted-foreground">Arată-l vânzătorului. Funcționează o singură dată, doar pentru această comandă.</p>
      {/* Demo convenience: lets the presenter "scan" on the same laptop. */}
      <a href={url} className="body-sm underline underline-offset-4">
        Deschide pagina de confirmare a vânzătorului
      </a>
    </div>
  );
}
