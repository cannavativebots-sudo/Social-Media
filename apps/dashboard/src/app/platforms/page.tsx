"use client";

import { useEffect, useState, useCallback } from "react";
import { PlatformStatus } from "@/components/PlatformStatus";
import { getPlatforms } from "@/lib/api";
import { registerWsHandler } from "../shell";
import type { PlatformConnection, WsEvent } from "digital-office-shared";

export default function PlatformsPage() {
  const [platforms, setPlatforms] = useState<PlatformConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlatforms()
      .then(setPlatforms)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleEvent = useCallback((event: WsEvent) => {
    if (event.type === "PLATFORM_STATUS_CHANGED") {
      setPlatforms((prev) =>
        prev.map((p) =>
          p.platform === event.platform ? { ...p, is_connected: event.connected } : p
        )
      );
    }
  }, []);

  useEffect(() => registerWsHandler(handleEvent), [handleEvent]);

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white">Platforms</h1>
        <p className="text-sm text-gray-500 mt-0.5">Connection status for each integrated platform</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {platforms.map((p) => <PlatformStatus key={p.platform} platform={p} />)}
        </div>
      )}
    </div>
  );
}
