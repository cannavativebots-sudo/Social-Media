"use client";

import { useEffect, useCallback } from "react";
import { BotCard } from "@/components/BotCard";
import { TriggerPanel } from "@/components/TriggerPanel";
import { useBots } from "@/hooks/useBots";
import { registerWsHandler } from "../shell";

export default function BotsPage() {
  const { bots, loading, handleWsEvent } = useBots();

  useEffect(() => registerWsHandler(handleWsEvent), [handleWsEvent]);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold text-white">Bots</h1>

      <TriggerPanel />

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {bots.map((b) => <BotCard key={b.role} bot={b} />)}
        </div>
      )}
    </div>
  );
}
