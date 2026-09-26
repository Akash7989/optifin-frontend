import { CircleCheck, Landmark, TriangleAlert } from "lucide-react";

import { formatCompactINR, formatINR, formatRate } from "@/lib/format";
import type { SimulationResult } from "@/lib/types";

import { Card, Metric, SegmentBar } from "./Card";

function Legend({ items }: { items: { color: string; label: string; value: string }[] }) {
  return (
    <ul className="mt-2 grid gap-1 text-xs text-slate-400 sm:grid-cols-3">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${i.color}`} />
          {i.label}: <span className="font-medium tabular-nums text-slate-200">{i.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function LoanCard({ result }: { result: SimulationResult }) {
  const { loan, downpayment_funding: funding, products } = result;
  const foirUsed = loan.existing_emis + loan.emi_on_eligible_loan;
  const headroom = Math.max(0, loan.max_total_emi - foirUsed);
  const bestLender = products.home_loans[0];

  return (
    <Card
      title="Home loan eligibility"
      subtitle={`Property at purchase: ${formatCompactINR(loan.property_value)} · ${loan.tenure_years}-year tenure at ${formatRate(loan.annual_rate)}`}
      icon={Landmark}
      accent="text-indigo-400"
      action={
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            loan.binding_constraint === "foir" ? "bg-amber-500/15 text-amber-300" : "bg-indigo-500/15 text-indigo-300"
          }`}
        >
          Limited by {loan.binding_constraint === "foir" ? "income (FOIR)" : "RBI LTV"}
        </span>
      }
    >
      <div>
        <div className="mb-1.5 flex justify-between text-xs text-slate-400">
          <span>Loan vs downpayment</span>
          <span className="tabular-nums">{formatCompactINR(loan.property_value)}</span>
        </div>
        <SegmentBar
          height="h-4"
          total={loan.property_value}
          segments={[
            { value: loan.eligible_loan, className: "bg-indigo-500", label: "Eligible loan" },
            { value: loan.required_downpayment, className: "bg-emerald-500", label: "Required downpayment" },
          ]}
        />
        <Legend
          items={[
            { color: "bg-indigo-500", label: "Max eligible loan", value: formatCompactINR(loan.eligible_loan) },
            { color: "bg-emerald-500", label: "Downpayment", value: formatCompactINR(loan.required_downpayment) },
            { color: "bg-slate-600", label: "LTV ceiling", value: formatCompactINR(loan.max_loan_by_ltv) },
          ]}
        />
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex justify-between text-xs text-slate-400">
          <span>FOIR utilisation at purchase</span>
          <span className="tabular-nums">Cap {formatRate(loan.foir_limit, 0)} · {formatINR(loan.max_total_emi)}/mo</span>
        </div>
        <SegmentBar
          total={loan.max_total_emi}
          segments={[
            { value: loan.existing_emis, className: "bg-slate-400", label: "Existing EMIs" },
            { value: loan.emi_on_eligible_loan, className: "bg-indigo-500", label: "New home loan EMI" },
          ]}
        />
        <Legend
          items={[
            { color: "bg-slate-400", label: "Existing EMIs", value: formatINR(loan.existing_emis) },
            { color: "bg-indigo-500", label: "New EMI", value: formatINR(loan.emi_on_eligible_loan) },
            { color: "bg-slate-700", label: "Headroom", value: formatINR(headroom) },
          ]}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Metric
          label="Downpayment needed"
          value={formatCompactINR(funding.required_downpayment)}
          hint={`${formatRate(loan.required_downpayment_ratio, 1)} of property value`}
        />
        <Metric
          label="Liquid reserves today"
          value={formatCompactINR(funding.liquid_assets_today)}
          hint={`Median projected corpus: ${formatCompactINR(funding.median_projected_corpus)}`}
        />
        <Metric
          label="Median funding gap"
          value={funding.median_shortfall > 0 ? formatCompactINR(funding.median_shortfall) : "None"}
          tone={funding.median_shortfall > 0 ? "text-rose-300" : "text-emerald-300"}
          hint="Downpayment minus median simulated corpus"
        />
        <Metric
          label="Indicative best rate"
          value={formatRate(result.assumptions.home_loan_rate)}
          hint={bestLender ? `${bestLender.lender}, repo + ${formatRate(bestLender.spread)}` : "No catalogue match; repo + 3%"}
        />
      </div>

      <ul className="mt-4 space-y-1.5 text-xs text-slate-400">
        <li className="flex items-start gap-1.5">
          <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
          RBI LTV band applied: {formatRate(loan.ltv_cap, 0)} for this property value (bands: 90% up to ₹30L, 80% up to ₹75L, 75% above).
        </li>
        <li className="flex items-start gap-1.5">
          {loan.current_foir <= loan.foir_limit ? (
            <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
          ) : (
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />
          )}
          FOIR cap of {formatRate(loan.foir_limit, 0)} on projected income of {formatINR(loan.projected_monthly_income)}/mo
          (bank practice: 40–60% by income tier; existing EMIs use {formatRate(loan.current_foir, 1)}).
        </li>
      </ul>
    </Card>
  );
}
