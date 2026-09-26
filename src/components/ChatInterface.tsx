"use client";

import { Bot, CircleAlert, LoaderCircle, MessageSquareText, RotateCcw, SendHorizontal, UserRound } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { errorMessage, postJson } from "@/lib/api";
import { formatCompactINR, formatINR } from "@/lib/format";
import type { ChatMessage, ExtractedProfile, IngestResponse, UserProfile } from "@/lib/types";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi, I'm your OptiFin planning assistant. Tell me about yourself in your own words: your age, " +
    "monthly take-home income, any loans or EMIs, savings and SIPs, life cover, and the home you want " +
    "to buy (its price today and when).",
};

const QUESTIONS_PER_TURN = 2;

interface Chip {
  label: string;
  value?: string;
}

function profileChips(p: ExtractedProfile): Chip[] {
  const income =
    p.net_monthly_income !== undefined
      ? `${formatINR(p.net_monthly_income)}/mo`
      : p.net_annual_income !== undefined
        ? `${formatCompactINR(p.net_annual_income)}/yr`
        : undefined;
  const when =
    p.goal_horizon_years !== undefined
      ? `in ${p.goal_horizon_years} Yrs`
      : p.goal_target_year !== undefined
        ? `by ${p.goal_target_year}`
        : undefined;
  const goal =
    p.target_goal_cost_today !== undefined
      ? `${formatCompactINR(p.target_goal_cost_today)} House${when ? ` ${when}` : ""}`
      : when
        ? `House ${when}`
        : undefined;
  const money = (v?: number, suffix = "") => (v === undefined ? undefined : `${formatCompactINR(v)}${suffix}`);
  return [
    { label: "Age", value: p.age?.toString() },
    { label: "Income", value: income },
    { label: "EMIs", value: money(p.existing_emis, "/mo") },
    { label: "Liabilities", value: money(p.outstanding_liabilities) },
    { label: "Liquid assets", value: money(p.liquid_assets) },
    { label: "SIP", value: money(p.current_monthly_sip, "/mo") },
    { label: "Life cover", value: money(p.current_life_cover) },
    { label: "Goal", value: goal },
    {
      label: "Risk",
      value: p.risk_tolerance && p.risk_tolerance[0].toUpperCase() + p.risk_tolerance.slice(1),
    },
  ];
}

export function ChatInterface({
  onProfileReady,
  onReset,
}: {
  onProfileReady: (profile: UserProfile) => void;
  onReset: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedProfile>({});
  const [questions, setQuestions] = useState<string[]>([]);
  const [complete, setComplete] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending, questions]);

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const history: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(history);
    setInput("");
    setSending(true);
    setError(null);
    try {
      const result = await postJson<IngestResponse>("/api/chat", { messages: history });
      setExtracted(result.extracted);
      setQuestions(result.questions);
      if (result.status === "ready" && result.profile) {
        setComplete(true);
        setMessages([
          ...history,
          { role: "assistant", content: "Thanks, I have everything I need. Running your loan, protection and goal analysis now." },
        ]);
        onProfileReady(result.profile);
      } else {
        setMessages([
          ...history,
          { role: "assistant", content: result.questions.slice(0, QUESTIONS_PER_TURN).join(" ") },
        ]);
      }
    } catch (err) {
      setError(errorMessage(err));
      setMessages(messages);
      setInput(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function reset() {
    setMessages([GREETING]);
    setExtracted({});
    setQuestions([]);
    setComplete(false);
    setError(null);
    setInput("");
    onReset();
  }

  const chips = profileChips(extracted);
  const captured = chips.filter((c) => c.value !== undefined).length;

  return (
    <section className="flex h-full min-h-[560px] flex-col rounded-2xl border border-slate-800 bg-slate-900/60">
      <header className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div className="flex items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-indigo-400" aria-hidden />
          <h2 className="text-sm font-semibold">Financial intake</h2>
        </div>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Start over
        </button>
      </header>

      <div className="border-b border-slate-800 px-5 py-3">
        <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-500">
          Profile captured · {captured}/{chips.length}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip.label}
              className={
                chip.value !== undefined
                  ? "rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300"
                  : "rounded-full border border-dashed border-slate-700 px-2.5 py-1 text-xs text-slate-500"
              }
            >
              {chip.label}
              {chip.value !== undefined && <>: <span className="font-medium">{chip.value}</span></>}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && <Bot className="mt-1 h-5 w-5 shrink-0 text-indigo-400" aria-hidden />}
            <p
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-sm bg-indigo-600 text-white"
                  : "rounded-bl-sm border border-slate-800 bg-slate-950 text-slate-200"
              }`}
            >
              {m.content}
            </p>
            {m.role === "user" && <UserRound className="mt-1 h-5 w-5 shrink-0 text-slate-500" aria-hidden />}
          </div>
        ))}
        {sending && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> Reading your details…
          </div>
        )}
        {!complete && !sending && questions.length > QUESTIONS_PER_TURN && (
          <div className="flex flex-wrap gap-1.5 pl-7">
            <span className="w-full text-[11px] uppercase tracking-wide text-slate-500">Also needed</span>
            {questions.slice(QUESTIONS_PER_TURN).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => inputRef.current?.focus()}
                className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-left text-xs text-indigo-200 hover:bg-indigo-500/20"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <p className="mx-5 mb-2 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> {error}
        </p>
      )}

      <form onSubmit={send} className="flex items-end gap-2 border-t border-slate-800 p-3">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={2}
          disabled={complete}
          placeholder={complete ? "Profile complete. Use Start over to change it." : "e.g. I'm 30, take home ₹80,000 a month…"}
          className="flex-1 resize-none rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={sending || complete || !input.trim()}
          className="rounded-xl bg-emerald-500 p-2.5 text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send message"
        >
          <SendHorizontal className="h-4 w-4" aria-hidden />
        </button>
      </form>
    </section>
  );
}
