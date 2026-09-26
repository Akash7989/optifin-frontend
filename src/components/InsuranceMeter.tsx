"use client";

import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatCompactINR, formatINR, formatRate } from "@/lib/format";
import type { SimulationResult } from "@/lib/types";

import { Card, Metric } from "./Card";

const SERIES = [
  { key: "hlv", name: "Income replacement (HLV)", color: "#6366f1" },
  { key: "debts", name: "Outstanding debts", color: "#a78bfa" },
  { key: "goals", name: "Goal commitments", color: "#38bdf8" },
  { key: "cover", name: "Existing life cover", color: "#10b981" },
  { key: "liquid", name: "Liquid assets", color: "#34d399" },
  { key: "gap", name: "Protection gap", color: "#f43f5e" },
] as const;

export function InsuranceMeter({ result }: { result: SimulationResult }) {
  const { insurance: ins, assumptions, products } = result;
  const covered = ins.net_required_cover <= 0;
  const data = [
    { row: "Need", hlv: ins.human_life_value, debts: ins.outstanding_liabilities, goals: ins.future_goal_commitments },
    { row: "Funded", cover: ins.current_term_cover, liquid: ins.liquid_assets, gap: ins.net_required_cover },
  ];

  return (
    <Card
      title="Life protection deficit"
      subtitle={`IALM 2012-14 mortality · ${formatRate(assumptions.discount_rate, 1)} G-Sec discount rate`}
      icon={covered ? ShieldCheck : ShieldAlert}
      accent={covered ? "text-emerald-400" : "text-rose-400"}
      action={
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            covered ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
          }`}
        >
          {covered ? "Fully covered" : `Gap ${formatCompactINR(ins.net_required_cover)}`}
        </span>
      }
    >
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }} barSize={28}>
            <CartesianGrid horizontal={false} stroke="#1e293b" />
            <XAxis type="number" tickFormatter={(v: number) => formatCompactINR(v)} stroke="#64748b" fontSize={11} />
            <YAxis type="category" dataKey="row" stroke="#94a3b8" fontSize={12} width={56} />
            <Tooltip
              cursor={{ fill: "#0f172a" }}
              contentStyle={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
              formatter={(value) => formatINR(Number(value))}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
            {SERIES.map((s) => (
              <Bar key={s.key} dataKey={s.key} name={s.name} stackId="total" fill={s.color} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Metric
          label="Income replacement (PV)"
          value={formatCompactINR(ins.human_life_value)}
          hint="Family share of earnings to age 60, survival-weighted and discounted"
        />
        <Metric
          label="Debt coverage required"
          value={formatCompactINR(ins.outstanding_liabilities)}
          hint="Outstanding loans the family would have to repay"
        />
        <Metric
          label="Total protection need"
          value={formatCompactINR(ins.gross_need)}
          hint={`Includes ${formatCompactINR(ins.future_goal_commitments)} of goal commitments`}
        />
        <Metric
          label={covered ? "Surplus resources" : "Additional term cover needed"}
          value={formatCompactINR(covered ? ins.surplus : ins.net_required_cover)}
          tone={covered ? "text-emerald-300" : "text-rose-300"}
          hint={`After ${formatCompactINR(ins.current_term_cover)} cover and ${formatCompactINR(ins.liquid_assets)} liquid assets`}
        />
      </div>

      {products.term_insurance.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-slate-500">
            Indicative annual premium for the gap{products.illustrative && " (illustrative rates)"}
          </p>
          <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800">
            {products.term_insurance.map((q) => (
              <li key={q.insurer} className="flex justify-between px-3 py-2 text-xs">
                <span className="text-slate-300">{q.insurer}</span>
                <span className="tabular-nums text-slate-100">{formatINR(q.annual_premium)}/yr</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
