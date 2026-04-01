"use client";

import { useState } from "react";
import clsx from "clsx";
import { Play, AlertCircle, Clock, Ban } from "lucide-react";
import { triggerBot } from "@/lib/api";
import type { BotRecord } from "digital-office-shared";

const STATUS_STYLES: Record<string, string> = {
  idle:     "bg-gray-700 text-gray-300",
  running:  "bg-yellow-500/20 text-yellow-300 animate-pulse",
  error:    "bg-red-500/20 text-red-400",
  disabled: "bg-gray-800 text-gray-600",
};

const STATUS_DOT: Record<string, string> = {
  idle:     "bg-green-500",
  running:  "bg-yellow-400 animate-pulse",
  error:    "bg-red-500",
  disabled: "bg-gray-600",
};

export function BotCard({ bot }: { bot: BotRecord }) {
  const [triggering, setTriggering] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleTrigger() {
    setErr(null);
    setTriggering(true);
    try {
      await triggerBot(bot.role);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setTriggering(false);
    }
  }

  const canTrigger = bot.is_enabled && bot.status !== "running" && bot.status !== "disabled";

  return (
    <div className="bg-surface-card border border-surface-border rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">{bot.name}</p>
          <p className="text-xs text-gray-500 font-mono">{bot.role}</p>
        </div>
        <span className={clsx("flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium", STATUS_STYLES[bot.status])}>
          <span className={clsx("w-1.5 h-1.5 rounded-full", STATUS_DOT[bot.status])} />
          {bot.status}
        </span>
      </div>

      {bot.error_message && (
        <div className="flex items-start gap-1.5 text-xs text-red-400 bg-red-500/10 rounded p-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span className="line-clamp-2">{bot.error_message}</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-1">
        {bot.last_run_at ? (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {new Date(bot.last_run_at).toLocaleTimeString()}
          </span>
        ) : (
          <span className="text-xs text-gray-600">Never run</span>
        )}

        {!bot.is_enabled ? (
          <span className="flex items-center gap-1 text-xs text-gray-600">
            <Ban className="w-3 h-3" /> disabled
          </span>
        ) : (
          <button
            onClick={handleTrigger}
            disabled={!canTrigger || triggering}
            className={clsx(
              "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-medium transition-colors",
              canTrigger && !triggering
                ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                : "bg-gray-800 text-gray-600 cursor-not-allowed"
            )}
          >
            <Play className="w-3 h-3" />
            {triggering ? "Starting…" : "Trigger"}
          </button>
        )}
      </div>

      {err && <p className="text-xs text-red-400">{err}</p>}
    </div>
  );
}
