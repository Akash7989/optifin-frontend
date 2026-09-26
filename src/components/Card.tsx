import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function Card({
  title,
  subtitle,
  icon: Icon,
  accent = "text-emerald-400",
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  accent?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm ${className}`}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-lg border border-slate-800 bg-slate-950 p-2">
            <Icon className={`h-4 w-4 ${accent}`} aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function Metric({
  label,
  value,
  hint,
  tone = "text-slate-100",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-base font-semibold tabular-nums ${tone}`}>{value}</p>
      {hint && <p className="mt-1 text-xs leading-snug text-slate-400">{hint}</p>}
    </div>
  );
}

/** Horizontal bar made of proportional segments. Widths are relative to `total`. */
export function SegmentBar({
  segments,
  total,
  height = "h-3",
}: {
  segments: { value: number; className: string; label: string }[];
  total: number;
  height?: string;
}) {
  const safeTotal = total > 0 ? total : 1;
  return (
    <div className={`flex w-full overflow-hidden rounded-full bg-slate-800 ${height}`} role="img"
      aria-label={segments.map((s) => s.label).join(", ")}>
      {segments.map((s) => (
        <div
          key={s.label}
          className={`${s.className} h-full transition-all duration-500`}
          style={{ width: `${Math.max(0, Math.min(100, (s.value / safeTotal) * 100))}%` }}
          title={s.label}
        />
      ))}
    </div>
  );
}
