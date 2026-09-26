"use client";

import { LoaderCircle, Minus, Plus, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { errorMessage, postJson } from "@/lib/api";
import { formatCompactINR, formatINR, formatPercent, formatRate } from "@/lib/format";
import type { GoalResult, SimulationResult, UserProfile } from "@/lib/types";

import { Card, Metric } from "./Card";

const SIP_STEP = 2_500;
const DEBOUNCE_MS = 400;
const TARGET_SUCCESS = 85;

function successTone(p: number) {
  if (p >= TARGET_SUCCESS) return { bar: "bg-emerald-500", text: "text-emerald-300", label: "On track" };
  if (p >= 60) return { bar: "bg-amber-400", text: "text-amber-300", label: "At risk" };
  return { bar: "bg-rose-500", text: "text-rose-300", label: "Off track" };
}

export function GoalChart({
  profile,
  initialGoal,
  simulationPaths,
}: {
  profile: UserProfile;
  initialGoal: GoalResult;
  simulationPaths: number;
}) {
  const baseSip = profile.current_monthly_sip;
  const [sip, setSip] = useState(baseSip);
  const [goal, setGoal] = useState(initialGoal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep the baseline SIP on the slider grid even when it is not a multiple of the step.
  const sliderMin = baseSip % SIP_STEP;
  const sliderMax = useMemo(() => {
    const ceiling = Math.max(initialGoal.required_monthly_sip * 1.25, baseSip + 10 * SIP_STEP);
    return sliderMin + Math.ceil((ceiling - sliderMin) / SIP_STEP) * SIP_STEP;
  }, [initialGoal.required_monthly_sip, baseSip, sliderMin]);

  useEffect(() => {
    if (sip === baseSip) {
      setGoal(initialGoal);
      setError(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await postJson<SimulationResult>(
          "/api/simulate",
          { ...profile, current_monthly_sip: sip },
          controller.signal,
        );
        setGoal(result.goal);
        setError(null);
      } catch (err) {
        if (!controller.signal.aborted) setError(errorMessage(err));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [sip, baseSip, profile, initialGoal]);

  const data = goal.trajectory.map((t) => ({ ...t, band: [t.p10, t.p90] as [number, number] }));
  const tone = successTone(goal.success_probability);
  const nudge = (delta: number) => setSip((s) => Math.min(sliderMax, Math.max(sliderMin, s + delta)));

  return (
    <Card
      title="Goal simulation: home downpayment"
      subtitle={`${simulationPaths.toLocaleString("en-IN")} Monte Carlo paths over ${profile.goal_horizon_years} years · expected return ${formatRate(goal.portfolio_mu, 1)}, volatility ${formatRate(goal.portfolio_sigma, 1)}`}
      icon={TrendingUp}
      action={loading ? <LoaderCircle className="h-4 w-4 animate-spin text-slate-400" aria-label="Recalculating" /> : null}
    >
      <div className={`h-72 transition-opacity ${loading ? "opacity-60" : ""}`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.15} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1e293b" vertical={false} />
            <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickFormatter={(y: number) => `Y${y}`} />
            <YAxis stroke="#64748b" fontSize={11} width={64} tickFormatter={(v: number) => formatCompactINR(v)} />
            <Tooltip
              contentStyle={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
              labelFormatter={(y) => `Year ${y}`}
              formatter={(value, name) =>
                Array.isArray(value)
                  ? [`${formatCompactINR(Number(value[0]))} – ${formatCompactINR(Number(value[1]))}`, name]
                  : [formatCompactINR(Number(value)), name]
              }
            />
            <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
            <Area dataKey="band" name="10th–90th percentile range" stroke="none" fill="url(#band)" isAnimationActive={false} />
            <Line dataKey="p90" name="90th percentile (bull)" stroke="#10b981" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <Line dataKey="p50" name="Median" stroke="#e2e8f0" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            <Line dataKey="p10" name="10th percentile (bear)" stroke="#f43f5e" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <ReferenceLine
              y={goal.target_downpayment}
              stroke="#f59e0b"
              strokeDasharray="6 4"
              ifOverflow="extendDomain"
              label={{ value: `Downpayment ${formatCompactINR(goal.target_downpayment)}`, fill: "#f59e0b", fontSize: 11, position: "insideTopLeft" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-xs text-slate-400">Probability of reaching the downpayment</span>
          <span className={`text-sm font-semibold tabular-nums ${tone.text}`}>
            {formatPercent(goal.success_probability)} · {tone.label}
          </span>
        </div>
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full ${tone.bar} transition-all duration-500`}
            style={{ width: `${Math.min(100, goal.success_probability)}%` }}
          />
          <div className="absolute inset-y-0 w-px bg-slate-200/70" style={{ left: `${TARGET_SUCCESS}%` }} title="85% target" />
        </div>
        <p className="mt-1 text-right text-[11px] text-slate-500">Target: {TARGET_SUCCESS}% of simulated paths</p>
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="sip" className="text-xs text-slate-400">
            Monthly SIP
          </label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => nudge(-SIP_STEP)} aria-label="Decrease SIP by ₹2,500"
              className="rounded-md border border-slate-700 p-1 text-slate-300 hover:bg-slate-800">
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[96px] text-center text-sm font-semibold tabular-nums">{formatINR(sip)}</span>
            <button type="button" onClick={() => nudge(SIP_STEP)} aria-label="Increase SIP by ₹2,500"
              className="rounded-md border border-slate-700 p-1 text-slate-300 hover:bg-slate-800">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <input
          id="sip"
          type="range"
          min={sliderMin}
          max={sliderMax}
          step={SIP_STEP}
          value={sip}
          onChange={(e) => setSip(Number(e.target.value))}
          className="mt-3 w-full accent-emerald-500"
        />
        <div className="mt-1 flex justify-between text-[11px] text-slate-500">
          <span>{formatINR(sliderMin)}</span>
          <span>Current plan: {formatINR(baseSip)}</span>
          <span>{formatINR(sliderMax)}</span>
        </div>
        {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Bear case (P10)" value={formatCompactINR(goal.wealth_p10)} tone="text-rose-300" />
        <Metric label="Median (P50)" value={formatCompactINR(goal.wealth_p50)} />
        <Metric label="Bull case (P90)" value={formatCompactINR(goal.wealth_p90)} tone="text-emerald-300" />
        <Metric
          label="SIP for 85% success"
          value={formatINR(goal.required_monthly_sip)}
          tone={goal.recommended_sip_delta > 0 ? "text-amber-300" : "text-emerald-300"}
          hint={goal.recommended_sip_delta > 0 ? `+${formatINR(goal.recommended_sip_delta)}/mo vs slider` : "Slider SIP is sufficient"}
        />
      </div>
    </Card>
  );
}
