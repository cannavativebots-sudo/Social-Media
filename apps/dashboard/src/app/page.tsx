"use client";

import { useEffect, useState, useCallback } from "react";
import { BotCard } from "@/components/BotCard";
import { LogFeed } from "@/components/LogFeed";
import { TriggerPanel } from "@/components/TriggerPanel";
import { PlatformStatus } from "@/components/PlatformStatus";
import { getBots, getLogs, getPlatforms } from "@/lib/api";
import { registerWsHandler } from "./shell";
import type { BotRecord, LogEntry, PlatformConnection, WsEvent } from "digital-office-shared";

export default function OverviewPage() {
  const [bots, setBots] = useState<BotRecord[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [platforms, setPlatforms] = useState<PlatformConnection[]>([]);

  useEffect(() => {
    getBots().then(setBots).catch(console.error);
    getLogs(20).then(setLogs).catch(console.error);
    getPlatforms().then(setPlatforms).catch(console.error);
  }, []);

  const handleEvent = useCallback((event: WsEvent) => {
    if (event.type === "BOT_STATUS_CHANGED") {
      setBots((prev) =>
        prev.map((b) => b.role === event.botId ? { ...b, status: event.status } : b)
      );
    }
    if (event.type === "LOG_ENTRY") {
      setLogs((prev) => [...prev.slice(-49), event.entry]);
    }
    if (event.type === "PLATFORM_STATUS_CHANGED") {
      setPlatforms((prev) =>
        prev.map((p) => p.platform === event.platform ? { ...p, is_connected: event.connected } : p)
      );
    }
  }, []);

  useEffect(() => registerWsHandler(handleEvent), [handleEvent]);

  const running = bots.filter((b) => b.status === "running").length;
  const errors  = bots.filter((b) => b.status === "error").length;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white">Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {running > 0 ? `${running} bot${running > 1 ? "s" : ""} running` : "All bots idle"}
          {errors > 0 && ` · ${errors} error${errors > 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Platforms row */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Platforms</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {platforms.map((p) => <PlatformStatus key={p.platform} platform={p} />)}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bot grid */}
        <section className="lg:col-span-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Bots</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {bots.map((b) => <BotCard key={b.role} bot={b} />)}
          </div>
        </section>

        {/* Right column */}
        <section className="flex flex-col gap-4">
          <TriggerPanel />

          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Logs</h2>
            <div className="bg-surface-card border border-surface-border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
              <LogFeed entries={logs} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
