import { formatINR, formatPercent, formatRate } from "./format";
import type { SimulationResult } from "./types";

/**
 * Headline figures for the explainer, pre-formatted (₹, %) so the narrator can quote them
 * verbatim. No chart series: only what a summary needs.
 */
export function explainPayload(r: SimulationResult) {
  const { loan, insurance, goal } = r;
  return {
    home_loan: {
      property_value_at_purchase: formatINR(loan.property_value),
      eligible_home_loan: formatINR(loan.eligible_loan),
      limit_from_repayment_capacity: formatINR(loan.max_loan_by_foir),
      limit_from_rbi_ltv_cap: formatINR(loan.max_loan_by_ltv),
      binding_constraint: loan.binding_constraint === "foir" ? "repayment capacity (FOIR)" : "RBI loan-to-value cap",
      foir_cap: formatRate(loan.foir_limit, 0),
      ltv_cap: formatRate(loan.ltv_cap, 0),
      interest_rate: formatRate(loan.annual_rate),
      tenure: `${loan.tenure_years} years`,
      existing_monthly_emis: formatINR(loan.existing_emis),
      new_monthly_emi: formatINR(loan.emi_on_eligible_loan),
      required_downpayment: formatINR(loan.required_downpayment),
    },
    life_protection: {
      human_life_value: formatINR(insurance.human_life_value),
      outstanding_liabilities: formatINR(insurance.outstanding_liabilities),
      goal_commitments: formatINR(insurance.future_goal_commitments),
      total_protection_need: formatINR(insurance.gross_need),
      existing_life_cover: formatINR(insurance.current_term_cover),
      liquid_assets: formatINR(insurance.liquid_assets),
      protection_deficit: formatINR(insurance.net_required_cover),
      surplus: formatINR(insurance.surplus),
    },
    goal_simulation: {
      success_probability: formatPercent(goal.success_probability, 2),
      target_success_probability: formatPercent(r.assumptions.target_success_probability, 0),
      target_downpayment: formatINR(goal.target_downpayment),
      bear_case_corpus: formatINR(goal.wealth_p10),
      median_corpus: formatINR(goal.wealth_p50),
      bull_case_corpus: formatINR(goal.wealth_p90),
      monthly_sip_needed_for_target: formatINR(goal.required_monthly_sip),
      additional_monthly_sip_needed: formatINR(goal.recommended_sip_delta),
    },
  };
}
