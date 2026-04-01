"use client";

import { useEffect, useState, useCallback } from "react";
import { LogFeed } from "@/components/LogFeed";
import { getLogs } from "@/lib/api";
import { registerWsHandler } from "../shell";
import type { LogEntry, WsEvent } from "digital-office-shared";

const LEVELS = ["all", "info", "warn", "error", "debug"] as const;
type Filter = (typeof LEVELS)[number];

export default function LogsPage() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    getLogs(200)
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleEvent = useCallback((event: WsEvent) => {
    if (event.type === "LOG_ENTRY") {
      setEntries((prev) => [...prev.slice(-499), event.entry]);
    }
  }, []);

  useEffect(() => registerWsHandler(handleEvent), [handleEvent]);

  const visible = filter === "all" ? entries : entries.filter((e) => e.level === filter);

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Logs</h1>
        <div className="flex gap-2">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setFilter(l)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors capitalize ${
                filter === l
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface-card border border-surface-border rounded-lg flex-1 overflow-hidden">
        {loading ? (
          <p className="p-4 text-sm text-gray-500">Loading…</p>
        ) : (
          <div className="h-[calc(100vh-12rem)] overflow-y-auto">
            <LogFeed entries={visible} />
          </div>
        )}
      </div>
    </div>
  );
}
