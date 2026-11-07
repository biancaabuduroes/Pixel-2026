/** Smooth SVG area chart — no chart library (hackathon constraint). */

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? i : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function formatAxisDay(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ro-RO", { day: "2-digit", month: "short" });
}

export function AreaChart({
  points,
  valueKey,
  label,
  formatValue,
}: {
  points: readonly { day: string; revenue: number; units: number; orders: number }[];
  valueKey: "revenue" | "units" | "orders";
  label: string;
  formatValue?: (v: number) => string;
}) {
  const values = points.map((p) => p[valueKey]);
  const max = Math.max(1, ...values);
  const width = 720;
  const height = 220;
  const padL = 40;
  const padR = 12;
  const padT = 16;
  const padB = 28;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const coords = points.map((p, i) => {
    const x = padL + (points.length <= 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
    const y = padT + plotH - (p[valueKey] / max) * plotH;
    return { x, y, day: p.day, value: p[valueKey] };
  });

  const line = smoothPath(coords);
  const area =
    coords.length === 0
      ? ""
      : `${line} L ${coords[coords.length - 1].x} ${padT + plotH} L ${coords[0].x} ${padT + plotH} Z`;

  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((t) => padT + plotH * (1 - t));
  const tickCount = Math.min(6, points.length);
  const tickIdx =
    points.length <= 1
      ? [0]
      : Array.from({ length: tickCount }, (_, i) => Math.round((i / (tickCount - 1)) * (points.length - 1)));

  const empty = points.length === 0 || values.every((v) => v === 0);

  return (
    <div className="w-full">
      {empty ? (
        <p className="body-md text-text-secondary">Nicio vânzare în perioada selectată.</p>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" role="img" aria-label={label}>
          <defs>
            <linearGradient id="seller-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--bg-brand)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--bg-brand)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {gridYs.map((y, i) => (
            <g key={i}>
              <line x1={padL} x2={width - padR} y1={y} y2={y} stroke="var(--border-subtle)" strokeWidth={1} />
              <text x={padL - 8} y={y + 4} textAnchor="end" className="fill-[var(--text-secondary)]" style={{ fontSize: 10 }}>
                {formatValue ? formatValue(Math.round(max * (1 - i / 4))) : Math.round(max * (1 - i / 4))}
              </text>
            </g>
          ))}
          <path d={area} fill="url(#seller-area-fill)" />
          <path d={line} fill="none" stroke="var(--bg-brand-strong)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          {tickIdx.map((i) => {
            const c = coords[i];
            if (!c) return null;
            return (
              <text key={c.day} x={c.x} y={height - 8} textAnchor="middle" className="fill-[var(--text-secondary)]" style={{ fontSize: 10 }}>
                {formatAxisDay(c.day)}
              </text>
            );
          })}
        </svg>
      )}
    </div>
  );
}
