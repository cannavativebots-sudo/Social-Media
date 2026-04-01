"use client";

import { useCallback, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { WsEvent } from "digital-office-shared";

type WsHandler = (e: WsEvent) => void;

// Module-level set so pages can subscribe without prop drilling
const handlers = new Set<WsHandler>();

export function registerWsHandler(fn: WsHandler) {
  handlers.add(fn);
  return () => { handlers.delete(fn); };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const onEvent = useCallback((event: WsEvent) => {
    handlers.forEach((h) => h(event));
  }, []);

  const wsStatus = useWebSocket(onEvent);

  return (
    <div className="flex min-h-screen">
      <Sidebar wsStatus={wsStatus} />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
