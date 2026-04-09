"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { triggerBot } from "@/lib/api";
import type { BotRole } from "digital-office-shared";

const TRIGGERS: { role: BotRole; label: string; defaultTask: string }[] = [
  {
    role: "director",
    label: "Director",
    defaultTask: "Review current state and delegate tasks to appropriate bots.",
  },
  {
    role: "content_creator",
    label: "Content Creator",
    defaultTask: "Create one Instagram post and one Facebook post for Cannavative. Check recent posts first to avoid repetition. For Instagram, call get_brand_image then include the URL in media_urls when saving. Save both posts using save_content.",
  },
  {
    role: "social_media_manager",
    label: "Social Media Manager",
    defaultTask: "Review pending posts and schedule approved content.",
  },
  {
    role: "scheduler",
    label: "Scheduler",
    defaultTask: "Process the publishing queue and dispatch overdue posts.",
  },
];

export function TriggerPanel() {
  const [selected, setSelected] = useState<BotRole>(TRIGGERS[0].role);
  const [task, setTask] = useState(TRIGGERS[0].defaultTask);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  function onRoleChange(role: BotRole) {
    setSelected(role);
    setTask(TRIGGERS.find((t) => t.role === role)!.defaultTask);
    setResult(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    setBusy(true);
    try {
      const res = await triggerBot(selected, { task });
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

      <div className="flex gap-2 flex-wrap">
        {TRIGGERS.map((t) => (
          <button
            key={t.role}
            type="button"
            onClick={() => onRoleChange(t.role)}
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

      <textarea
        value={task}
        onChange={(e) => setTask(e.target.value)}
        rows={2}
        className="w-full bg-surface text-sm text-gray-200 border border-surface-border rounded p-2 resize-none focus:outline-none focus:border-indigo-500"
        placeholder="Task description…"
      />

      <div className="flex items-center justify-between gap-2">
        {result ? (
          <p className={`text-xs ${result.ok ? "text-green-400" : "text-red-400"}`}>{result.msg}</p>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={busy || !task.trim()}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50 transition-colors"
        >
          <Zap className="w-3.5 h-3.5" />
          {busy ? "Firing…" : "Fire"}
        </button>
      </div>
    </form>
  );
}
