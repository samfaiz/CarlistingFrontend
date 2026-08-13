/**
 * Dependency-free SVG area chart for workspace dashboards (P3-05).
 *
 * Time flows start→end left-to-right regardless of text direction — a time
 * axis is a number line, not prose — so the SVG pins itself LTR while the
 * labels around it follow the document direction.
 */
import * as React from "react";
import { Panel } from "@/components/ui/card";

const W = 600;
const H = 120;
const PAD = 4;

export function TrendChart({
  title,
  total,
  points,
  ariaLabel,
}: {
  title: string;
  total: number;
  points: { date: string; value: number }[];
  ariaLabel: string;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const stepX = points.length > 1 ? (W - PAD * 2) / (points.length - 1) : 0;
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2);
  const coords = points.map(
    (p, i) => [PAD + i * stepX, y(p.value)] as const,
  );
  const lineD = coords
    .map(([px, py], i) => `${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`)
    .join(" ");
  const areaD = coords.length
    ? `${lineD} L${coords[coords.length - 1][0].toFixed(1)},${H - PAD} L${PAD},${H - PAD} Z`
    : "";

  const shortDate = (iso: string) =>
    new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(
      new Date(`${iso}T00:00:00`),
    );

  return (
    <Panel className="p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs text-muted">{title}</p>
        <p className="text-lg font-extrabold text-ink">{total.toLocaleString()}</p>
      </div>
      {points.length > 1 ? (
        <>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={ariaLabel}
            className="mt-2 w-full"
            style={{ direction: "ltr" }}
            preserveAspectRatio="none"
          >
            <path d={areaD} fill="var(--color-brand-light)" />
            <path
              d={lineD}
              fill="none"
              stroke="var(--color-brand-mid)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="mt-1 flex justify-between text-[10px] text-muted" style={{ direction: "ltr" }}>
            <span>{shortDate(points[0].date)}</span>
            <span>{shortDate(points[points.length - 1].date)}</span>
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted">—</p>
      )}
    </Panel>
  );
}
