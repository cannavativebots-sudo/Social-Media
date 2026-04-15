"use client";

import { useEffect, useState } from "react";
import { TrendingUp, RefreshCw, ChevronDown, ChevronUp, Clock, Calendar, Hash, Users, BarChart2 } from "lucide-react";
import { getStrategyReports, triggerBot, type StrategyReport } from "@/lib/api";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return "just now";
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="border border-surface-border rounded-lg p-4">
      <h3 className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        <Icon className="w-3.5 h-3.5" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function ReportDetail({ report }: { report: Record<string, unknown> }) {
  const schedule = report.posting_schedule as Record<string, unknown> | undefined;
  const frequency = report.frequency_targets as Record<string, unknown> | undefined;
  const themes = report.content_themes as Record<string, unknown> | undefined;
  const hashtags = report.hashtag_strategy as Record<string, unknown> | undefined;
  const competitors = report.competitor_insights as Record<string, unknown> | undefined;
  const captions = report.caption_optimization as Record<string, unknown> | undefined;

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">

      {/* Posting Schedule */}
      {schedule && (
        <Section icon={Calendar} title="Posting Schedule">
          {(["facebook", "instagram"] as const).map((platform) => {
            const p = (schedule[platform] as Record<string, unknown>) ?? {};
            return (
              <div key={platform} className="mb-3 last:mb-0">
                <p className="text-xs font-semibold text-indigo-400 capitalize mb-1">{platform}</p>
                <p className="text-xs text-gray-300">{p.frequency_per_week as string}</p>
                {Array.isArray(p.optimal_windows_pst) && (
                  <p className="text-xs text-gray-500 mt-0.5">{(p.optimal_windows_pst as string[]).join("  ·  ")}</p>
                )}
                {Array.isArray(p.optimal_days) && (
                  <p className="text-xs text-gray-600 mt-0.5">{(p.optimal_days as string[]).join(", ")}</p>
                )}
              </div>
            );
          })}
        </Section>
      )}

      {/* Frequency */}
      {frequency && (
        <Section icon={Clock} title="Frequency Targets">
          <p className="text-xs text-gray-400 mb-1">Current: <span className="text-white">{frequency.current_state as string}</span></p>
          <p className="text-xs text-gray-400 mb-1">Target: <span className="text-green-400">{frequency.recommended_increase as string}</span></p>
          {frequency.retention_impact && (
            <p className="text-xs text-gray-500 mt-2 italic">{frequency.retention_impact as string}</p>
          )}
        </Section>
      )}

      {/* Content Themes */}
      {themes && (
        <Section icon={BarChart2} title="Content Themes">
          {Array.isArray((themes as Record<string, unknown>).content_to_double_down) && (
            <div className="mb-3">
              <p className="text-xs text-green-400 font-medium mb-1.5">Double down on</p>
              <ul className="flex flex-col gap-1">
                {((themes as Record<string, unknown>).content_to_double_down as Array<Record<string, string>>).map((t, i) => (
                  <li key={i} className="text-xs text-gray-300 flex justify-between gap-2">
                    <span>{t.theme}</span>
                    <span className="text-green-500 shrink-0">{t.engagement_lift}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray((themes as Record<string, unknown>).content_to_reduce) && (
            <div>
              <p className="text-xs text-red-400 font-medium mb-1.5">Reduce</p>
              <ul className="flex flex-col gap-1">
                {((themes as Record<string, unknown>).content_to_reduce as string[]).map((t, i) => (
                  <li key={i} className="text-xs text-gray-500">{t}</li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      )}

      {/* Hashtag Strategy */}
      {hashtags && (
        <Section icon={Hash} title="Hashtag Strategy">
          <p className="text-xs text-gray-400 mb-2">{hashtags.optimal_count as string}</p>
          {(hashtags.hashtag_mix as Record<string, string[]> | undefined) && (
            <div className="flex flex-col gap-2">
              {Object.entries(hashtags.hashtag_mix as Record<string, string[]>).map(([category, tags]) => (
                <div key={category}>
                  <p className="text-xs text-gray-500 capitalize mb-1">{category.replace(/_/g, " ")}</p>
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <span key={tag} className="text-xs bg-gray-800 text-indigo-300 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {hashtags.tags_to_avoid && (
            <p className="text-xs text-red-400 mt-2">Avoid: {(hashtags.tags_to_avoid as string[]).join(", ")}</p>
          )}
        </Section>
      )}

      {/* Competitor Insights */}
      {competitors && (competitors.top_performing_brands_analysis as Record<string, unknown>) && (
        <Section icon={Users} title="Competitor Insights">
          <div className="flex flex-col gap-2">
            {Object.entries(competitors.top_performing_brands_analysis as Record<string, Record<string, string>>).map(([brand, data]) => (
              <div key={brand} className="border-b border-surface-border pb-2 last:border-0 last:pb-0">
                <p className="text-xs font-semibold text-indigo-400 capitalize mb-0.5">{brand.replace(/_/g, " ")}</p>
                <p className="text-xs text-gray-500">{data.applicable_to_cannavative}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Caption Tips */}
      {captions && Array.isArray(captions.engagement_drivers) && (
        <Section icon={TrendingUp} title="Caption Optimization">
          {captions.hook_strategy && (
            <p className="text-xs text-gray-300 mb-2">{captions.hook_strategy as string}</p>
          )}
          <ul className="flex flex-col gap-1">
            {(captions.engagement_drivers as string[]).map((tip, i) => (
              <li key={i} className="text-xs text-gray-500 flex gap-1.5">
                <span className="text-indigo-500 shrink-0">·</span>
                {tip}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function ReportCard({ report, defaultOpen }: { report: StrategyReport; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  const lines = (report.summary ?? "").split("\n").filter((l) => l.trim());

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">Strategy Report</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(report.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
              <span className="ml-2 text-gray-600">({timeAgo(report.created_at)})</span>
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-surface-border">
          {/* Summary bullets */}
          {lines.length > 0 && (
            <div className="mt-4 mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Key Recommendations</p>
              <ul className="flex flex-col gap-2">
                {lines.filter((l) => l.trim().match(/^\d+\./)).map((line, i) => (
                  <li key={i} className="text-sm text-gray-300 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong class='text-white'>$1</strong>") }}
                  />
                ))}
              </ul>
            </div>
          )}

          {/* Structured detail */}
          {Object.keys(report.report ?? {}).length > 0 && (
            <ReportDetail report={report.report} />
          )}
        </div>
      )}
    </div>
  );
}

export default function StrategyPage() {
  const [reports, setReports] = useState<StrategyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null);

  useEffect(() => {
    getStrategyReports()
      .then(setReports)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function runAnalysis() {
    setTriggering(true);
    setTriggerMsg(null);
    try {
      await triggerBot("marketing_strategist", {
        task: "Analyze our post history and produce a full strategy report with posting cadence, content themes, competitor insights, and hashtag recommendations.",
      });
      setTriggerMsg("Analysis running — refresh in a minute to see the new report.");
    } catch (e) {
      setTriggerMsg((e as Error).message);
    } finally {
      setTriggering(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Strategy Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Cadence analysis, competitor insights, and content recommendations
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={triggering}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${triggering ? "animate-spin" : ""}`} />
          {triggering ? "Running…" : "Run Analysis"}
        </button>
      </div>

      {triggerMsg && (
        <p className="text-sm text-indigo-300 bg-indigo-900/30 border border-indigo-800 rounded-lg px-4 py-2">
          {triggerMsg}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <TrendingUp className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No strategy reports yet.</p>
          <p className="text-xs mt-1">Click &ldquo;Run Analysis&rdquo; to generate the first one.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((r, i) => (
            <ReportCard key={r.id} report={r} defaultOpen={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}
