// Mirrors the FastAPI contracts in optifin-be/app/models and app/api/pipeline.py.

export type RiskTolerance = "conservative" | "moderate" | "aggressive";

export interface UserProfile {
  age: number;
  net_monthly_income: number;
  existing_emis: number;
  liquid_assets: number;
  outstanding_liabilities: number;
  current_monthly_sip: number;
  current_life_cover: number;
  target_goal_cost_today: number;
  goal_horizon_years: number;
  risk_tolerance: RiskTolerance;
}

export type ExtractedProfile = Partial<UserProfile> & {
  net_annual_income?: number;
  goal_target_year?: number;
};

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface IngestResponse {
  status: "incomplete" | "ready";
  questions: string[];
  profile: UserProfile | null;
  extracted: ExtractedProfile;
}

export interface LoanCapacity {
  property_value: number;
  projected_monthly_income: number;
  existing_emis: number;
  current_foir: number;
  foir_limit: number;
  max_total_emi: number;
  available_emi: number;
  annual_rate: number;
  tenure_years: number;
  max_loan_by_foir: number;
  ltv_cap: number;
  max_loan_by_ltv: number;
  eligible_loan: number;
  binding_constraint: "foir" | "ltv";
  required_downpayment: number;
  required_downpayment_ratio: number;
  emi_on_eligible_loan: number;
}

export interface CoverDeficit {
  human_life_value: number;
  outstanding_liabilities: number;
  future_goal_commitments: number;
  gross_need: number;
  liquid_assets: number;
  current_term_cover: number;
  available_resources: number;
  net_required_cover: number;
  surplus: number;
}

export interface YearlyPercentiles {
  year: number;
  p10: number;
  p50: number;
  p90: number;
}

export interface GoalResult {
  future_target_cost: number;
  target_downpayment: number;
  portfolio_mu: number;
  portfolio_sigma: number;
  success_probability: number; // percent, 0-100
  wealth_p10: number;
  wealth_p50: number;
  wealth_p90: number;
  required_monthly_sip: number;
  recommended_sip_delta: number;
  trajectory: YearlyPercentiles[];
}

export interface LoanOffer {
  lender: string;
  loan_type: string;
  credit_band_min_score: number;
  spread: number;
  repo_rate: number;
  interest_rate: number;
}

export interface TermQuote {
  insurer: string;
  plan: string;
  age: number;
  sum_assured: number;
  annual_premium: number;
}

export interface SimulationResult {
  assumptions: {
    repo_rate: number;
    discount_rate: number;
    real_estate_inflation: number;
    income_growth: number;
    assumed_credit_score: number;
    equity_allocation: number;
    home_loan_rate: number;
    downpayment_ratio: number;
    simulation_paths: number;
    simulation_seed: number;
    target_success_probability: number;
  };
  loan: LoanCapacity;
  insurance: CoverDeficit;
  goal: GoalResult;
  downpayment_funding: {
    required_downpayment: number;
    liquid_assets_today: number;
    median_projected_corpus: number;
    median_shortfall: number;
  };
  products: {
    illustrative: boolean;
    home_loans: LoanOffer[];
    term_insurance: TermQuote[];
  };
  notes: string[];
}

export interface ExplainResponse {
  narrative_explanation: string;
}

export interface ApiErrorEnvelope {
  error: { code: string; message: string; details?: unknown };
}
