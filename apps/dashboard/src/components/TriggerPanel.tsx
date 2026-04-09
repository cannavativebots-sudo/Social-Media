"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { triggerBot } from "@/lib/api";
import type { BotRole } from "digital-office-shared";

const BRANDS = [
  {
    id: "cannavative",
    label: "Cannavative",
    theme: "Brand story, Nevada adult-use culture, community values, behind-the-scenes, responsible use education. Warm and knowledgeable tone.",
  },
  {
    id: "motivator",
    label: "Motivator",
    theme: "Energy, motivation, daytime productivity lifestyle. Focus on active Nevada adults who value a balanced lifestyle. Upbeat and inspiring tone.",
  },
  {
    id: "resin8",
    label: "Resin8",
    theme: "Premium concentrate enthusiasts, craft quality, artisanal process, connoisseur culture. Sophisticated and craft-focused tone.",
  },
  {
    id: "tidal",
    label: "Tidal",
    theme: "Relaxation, coastal calm, winding down, evening lifestyle, self-care. Serene and inviting tone.",
  },
];

const PLATFORMS = ["instagram", "facebook", "both"] as const;
type PlatformChoice = typeof PLATFORMS[number];

const TRIGGERS: { role: BotRole; label: string }[] = [
  { role: "director",             label: "Director" },
  { role: "content_creator",      label: "Content Creator" },
  { role: "social_media_manager", label: "Social Media Manager" },
  { role: "scheduler",            label: "Scheduler" },
];

function buildContentCreatorTask(brand: string, platform: PlatformChoice, direction: string) {
  const b = BRANDS.find((b) => b.id === brand)!;
  const platformStr = platform === "both"
    ? "one Instagram post and one Facebook post"
    : `one ${platform} post`;
  const igNote = (platform === "instagram" || platform === "both")
    ? " For Instagram, call get_brand_image (brand: \"" + brand + "\") and include the URL in media_urls when saving."
    : "";
  return `Create ${platformStr} for the ${b.label} brand.

Brand theme: ${b.theme}

${direction ? `Additional direction from human: ${direction}\n` : ""}Check recent posts first to avoid repeating content. All posts MUST follow Nevada CCB compliance rules and Meta advertising policies. Append the required disclaimer.${igNote} Save all posts using save_content.`;
}

export function TriggerPanel() {
  const [selected, setSelected] = useState<BotRole>("content_creator");
  const [brand, setBrand] = useState("cannavative");
  const [platform, setPlatform] = useState<PlatformChoice>("both");
  const [direction, setDirection] = useState("");
  const [task, setTask] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const isContentCreator = selected === "content_creator";

  function getTask() {
    if (isContentCreator) return buildContentCreatorTask(brand, platform, direction);
    return task;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    setBusy(true);
    try {
      const res = await triggerBot(selected, { task: getTask() });
      setResult({ ok: true, msg: res.message });
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : "Failed" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface-card border border-surface-border rounded-lg p-4 flex flex-col gap-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Manual Trigger</p>

      {/* Bot selector */}
      <div className="flex gap-2 flex-wrap">
        {TRIGGERS.map((t) => (
          <button
            key={t.role}
            type="button"
            onClick={() => { setSelected(t.role); setResult(null); }}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
              selected === t.role
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content Creator controls */}
      {isContentCreator ? (
        <>
          {/* Brand */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Brand</label>
            <div className="flex gap-1.5 flex-wrap">
              {BRANDS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBrand(b.id)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${
                    brand === b.id
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Platform</label>
            <div className="flex gap-1.5">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`flex-1 text-xs py-1 rounded-lg font-medium border transition-colors capitalize ${
                    platform === p
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Direction */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Direction / brief (optional)</label>
            <textarea
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              rows={2}
              placeholder="e.g. Focus on our new Resin8 live rosin drop, use a celebratory tone..."
              className="w-full bg-surface text-sm text-gray-200 border border-surface-border rounded p-2 resize-none focus:outline-none focus:border-indigo-500"
            />
          </div>
        </>
      ) : (
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          rows={2}
          className="w-full bg-surface text-sm text-gray-200 border border-surface-border rounded p-2 resize-none focus:outline-none focus:border-indigo-500"
          placeholder="Task description…"
        />
      )}

      <div className="flex items-center justify-between gap-2">
        {result ? (
          <p className={`text-xs ${result.ok ? "text-green-400" : "text-red-400"}`}>{result.msg}</p>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={busy || (!isContentCreator && !task.trim())}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50 transition-colors"
        >
          <Zap className="w-3.5 h-3.5" />
          {busy ? "Firing…" : "Fire"}
        </button>
      </div>
    </form>
  );
}
