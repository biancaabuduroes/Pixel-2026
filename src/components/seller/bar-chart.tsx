/** Simple SVG bar chart — no chart library (hackathon constraint). */
export function BarChart({
  points,
  valueKey,
  label,
}: {
  points: readonly { day: string; revenue: number; units: number; orders: number }[];
  valueKey: "revenue" | "units" | "orders";
  label: string;
}) {
  const values = points.map((p) => p[valueKey]);
  const max = Math.max(1, ...values);
  const width = 640;
  const height = 180;
  const pad = 8;
  const barGap = 2;
  const barW = points.length === 0 ? 0 : (width - pad * 2) / points.length;

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border-default bg-bg-surface p-4 shadow-card">
      <p className="mb-3 label-sm text-text-secondary">{label}</p>
      {points.length === 0 || values.every((v) => v === 0) ? (
        <p className="body-md text-text-secondary">Nicio vânzare în perioada selectată.</p>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full" role="img" aria-label={label}>
          {points.map((p, i) => {
            const v = p[valueKey];
            const h = Math.round(((height - pad * 2) * v) / max);
            const x = pad + i * barW;
            const y = height - pad - h;
            return <rect key={p.day} x={x + barGap / 2} y={y} width={Math.max(1, barW - barGap)} height={h} rx={2} className="fill-bg-brand-strong" />;
          })}
        </svg>
      )}
    </div>
  );
}
