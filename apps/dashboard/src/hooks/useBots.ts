"use client";

import { useEffect, useState, useCallback } from "react";
import { getBots } from "@/lib/api";
import type { BotRecord, WsEvent } from "digital-office-shared";

export function useBots() {
  const [bots, setBots] = useState<BotRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBots()
      .then(setBots)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleWsEvent = useCallback((event: WsEvent) => {
    if (event.type !== "BOT_STATUS_CHANGED") return;
    setBots((prev) =>
      prev.map((b) =>
        b.role === event.botId
          ? { ...b, status: event.status, last_run_at: event.status === "running" ? new Date() : b.last_run_at }
          : b
      )
    );
  }, []);

  return { bots, loading, handleWsEvent };
}
