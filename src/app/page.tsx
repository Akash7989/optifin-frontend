"use client";

import { Activity, CircleAlert, LoaderCircle } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { AdvisorySummary } from "@/components/AdvisorySummary";
import { ChatInterface } from "@/components/ChatInterface";
import { GoalChart } from "@/components/GoalChart";
import { InsuranceMeter } from "@/components/InsuranceMeter";
import { LoanCard } from "@/components/LoanCard";
import { errorMessage, postJson } from "@/lib/api";
import { explainPayload } from "@/lib/explain";
import type { ExplainResponse, SimulationResult, UserProfile } from "@/lib/types";

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);
  const runId = useRef(0);

  const explain = useCallback(async (p: UserProfile, r: SimulationResult, id: number) => {
    setExplaining(true);
    setExplainError(null);
    try {
      const response = await postJson<ExplainResponse>("/api/explain", { profile: p, results: explainPayload(r) });
      if (runId.current === id) setNarrative(response.narrative_explanation);
    } catch (err) {
      if (runId.current === id) setExplainError(errorMessage(err));
    } finally {
      if (runId.current === id) setExplaining(false);
    }
  }, []);

  const analyse = useCallback(
    async (p: UserProfile) => {
      const id = ++runId.current;
      setProfile(p);
      setResult(null);
      setNarrative(null);
      setSimError(null);
      setSimulating(true);
      try {
        const r = await postJson<SimulationResult>("/api/simulate", p);
        if (runId.current !== id) return;
        setResult(r);
        setSimulating(false);
        void explain(p, r, id);
      } catch (err) {
        if (runId.current === id) {
          setSimError(errorMessage(err));
          setSimulating(false);
        }
      }
    },
    [explain],
  );

  const reset = useCallback(() => {
    runId.current++;
    setProfile(null);
    setResult(null);
    setNarrative(null);
    setSimError(null);
    setExplainError(null);
    setSimulating(false);
    setExplaining(false);
  }, []);

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-indigo-500">
              <Activity className="h-4 w-4 text-slate-950" aria-hidden />
            </span>
            <span className="text-base font-semibold tracking-tight">
              OptiFin<span className="text-emerald-400">.ai</span>
            </span>
          </div>
          <p className="hidden text-xs text-slate-500 sm:block">Home loan · Life protection · Goal simulation</p>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[400px_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-5 lg:h-[calc(100vh-6.5rem)]">
          <ChatInterface onProfileReady={analyse} onReset={reset} />
        </div>

        <div className="min-w-0 space-y-5">
          {simError && (
            <div className="flex items-start justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              <span className="flex items-start gap-2">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {simError}
              </span>
              {profile && (
                <button type="button" onClick={() => void analyse(profile)} className="shrink-0 text-xs underline">
                  Retry
                </button>
              )}
            </div>
          )}

          {simulating && (
            <div className="grid gap-5 xl:grid-cols-2" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`h-72 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60 ${i === 2 ? "xl:col-span-2" : ""}`} />
              ))}
              <p className="flex items-center gap-2 text-sm text-slate-400 xl:col-span-2">
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> Running 10,000-path simulation…
              </p>
            </div>
          )}

          {!result && !simulating && !simError && <EmptyState />}

          {result && profile && (
            <>
              <div className="grid gap-5 xl:grid-cols-2">
                <LoanCard result={result} />
                <InsuranceMeter result={result} />
              </div>
              <GoalChart
                key={runId.current}
                profile={profile}
                initialGoal={result.goal}
                simulationPaths={result.assumptions.simulation_paths}
              />
              <AdvisorySummary
                result={result}
                narrative={narrative}
                loading={explaining}
                error={explainError}
                onRetry={() => void explain(profile, result, runId.current)}
              />
              {result.notes.length > 0 && (
                <ul className="space-y-1 text-xs text-slate-500">
                  {result.notes.map((n) => (
                    <li key={n}>· {n}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function EmptyState() {
  const steps = [
    ["Tell us about you", "Describe your income, loans, savings and the home you want, in plain language."],
    ["We calculate", "RBI LTV and FOIR limits, IALM 2012-14 life value, and 10,000 market scenarios."],
    ["You adjust", "Move the SIP slider to see how your odds of reaching the downpayment change."],
  ];
  return (
    <div className="flex min-h-[420px] flex-col justify-center rounded-2xl border border-dashed border-slate-800 p-8">
      <h1 className="text-xl font-semibold tracking-tight">Your home-buying plan, stress-tested.</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-400">
        Start the conversation on the left. Your dashboard appears here once your profile is complete.
      </p>
      <ol className="mt-6 grid gap-3 sm:grid-cols-3">
        {steps.map(([title, text], i) => (
          <li key={title} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <span className="text-xs font-semibold text-emerald-400">0{i + 1}</span>
            <p className="mt-1 text-sm font-medium">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
