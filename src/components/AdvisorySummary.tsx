import { CircleCheck, Info, LoaderCircle, RotateCcw, Sparkles, TriangleAlert } from "lucide-react";

import { formatCompactINR, formatINR, formatPercent, formatRate } from "@/lib/format";
import type { SimulationResult } from "@/lib/types";

import { Card } from "./Card";

export const PLATFORM_DISCLAIMER =
  "OptiFin.ai is an educational simulation tool powered by actuarial models and banking FOIR guidelines. " +
  "Not an authorized SEBI investment advisor or IRDAI insurance broker.";

const BACKEND_DISCLAIMER_PREFIX = "Simulated projections based on";

function splitNarrative(narrative: string) {
  const paragraphs = narrative.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const last = paragraphs.at(-1);
  if (last?.startsWith(BACKEND_DISCLAIMER_PREFIX)) {
    return { body: paragraphs.slice(0, -1), modelDisclaimer: last };
  }
  return { body: paragraphs, modelDisclaimer: null };
}

function takeaways(r: SimulationResult) {
  const { goal, loan, insurance } = r;
  const points = [
    `${formatPercent(goal.success_probability)} of simulated paths fund the ${formatCompactINR(goal.target_downpayment)} downpayment (target ${formatPercent(r.assumptions.target_success_probability, 0)}).`,
    `Eligible home loan of ${formatCompactINR(loan.eligible_loan)} at ${formatRate(loan.annual_rate)}, limited by ${loan.binding_constraint === "foir" ? "repayment capacity (FOIR)" : "the RBI loan-to-value cap"}.`,
    insurance.net_required_cover > 0
      ? `Protection need of ${formatCompactINR(insurance.gross_need)} leaves a ${formatCompactINR(insurance.net_required_cover)} term cover gap.`
      : `Existing cover and liquid assets meet the ${formatCompactINR(insurance.gross_need)} protection need.`,
  ];
  const risks: string[] = [];
  if (goal.recommended_sip_delta > 0) {
    risks.push(`The current SIP falls short; ${formatINR(goal.required_monthly_sip)}/mo reaches the 85% threshold.`);
  }
  if (insurance.net_required_cover > 0) {
    risks.push(`Dependants are exposed to a ${formatCompactINR(insurance.net_required_cover)} shortfall in the event of death.`);
  }
  if (loan.binding_constraint === "foir") {
    risks.push("Loan size is constrained by income; new EMIs or lower income would reduce eligibility further.");
  }
  if (r.products.illustrative) {
    risks.push("Lender and insurer rates are illustrative placeholders, not live quotes.");
  }
  return { points, risks };
}

export function AdvisorySummary({
  result,
  narrative,
  loading,
  error,
  onRetry,
}: {
  result: SimulationResult;
  narrative: string | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const { points, risks } = takeaways(result);
  const { body, modelDisclaimer } = narrative ? splitNarrative(narrative) : { body: [], modelDisclaimer: null };

  return (
    <Card title="Executive summary" subtitle="AI narration of the calculated results" icon={Sparkles} accent="text-indigo-400">
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3 text-sm leading-relaxed text-slate-300">
          {loading && (
            <p className="flex items-center gap-2 text-slate-400">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> Preparing the narrative…
            </p>
          )}
          {error && !loading && (
            <div className="flex items-start justify-between gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              <span>{error}</span>
              <button type="button" onClick={onRetry} className="flex shrink-0 items-center gap-1 underline">
                <RotateCcw className="h-3 w-3" aria-hidden /> Retry
              </button>
            </div>
          )}
          {body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {modelDisclaimer && <p className="text-xs italic text-slate-500">{modelDisclaimer}</p>}
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-500">Key takeaways</p>
            <ul className="space-y-2 text-xs text-slate-300">
              {points.map((p) => (
                <li key={p} className="flex gap-2">
                  <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          {risks.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-500">Risk warnings</p>
              <ul className="space-y-2 text-xs text-amber-200/90">
                {risks.map((r) => (
                  <li key={r} className="flex gap-2">
                    <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-5 flex items-start gap-2 border-t border-slate-800 pt-4 text-[11px] leading-relaxed text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        {PLATFORM_DISCLAIMER}
      </footer>
    </Card>
  );
}
