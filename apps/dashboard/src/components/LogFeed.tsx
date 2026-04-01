"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import type { LogEntry } from "digital-office-shared";

const LEVEL_STYLES: Record<string, string> = {
  info:  "text-blue-400",
  warn:  "text-yellow-400",
  error: "text-red-400",
  debug: "text-gray-500",
};

const LEVEL_BG: Record<string, string> = {
  info:  "",
  warn:  "bg-yellow-500/5",
  error: "bg-red-500/5",
  debug: "",
};

export function LogFeed({ entries, autoScroll = true }: { entries: LogEntry[]; autoScroll?: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [entries, autoScroll]);

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-600 text-sm">
        No log entries yet
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-surface-border font-mono text-xs overflow-y-auto">
      {entries.map((e) => (
        <div key={e.id} className={clsx("flex gap-3 px-3 py-2", LEVEL_BG[e.level])}>
          <span className="text-gray-600 shrink-0 tabular-nums">
            {new Date(e.created_at).toLocaleTimeString()}
          </span>
          <span className={clsx("w-10 shrink-0 font-semibold uppercase", LEVEL_STYLES[e.level])}>
            {e.level}
          </span>
          {e.bot_role && (
            <span className="text-indigo-400 shrink-0 w-20 truncate">{e.bot_role}</span>
          )}
          <span className="text-gray-300 break-all">{e.message}</span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
