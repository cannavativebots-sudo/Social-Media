"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { WS_URL, type WsEvent } from "@/lib/ws-types";

type Handler = (event: WsEvent) => void;

export type WsStatus = "connecting" | "connected" | "disconnected";

export function useWebSocket(onEvent: Handler) {
  const [status, setStatus] = useState<WsStatus>("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onmessage = null;
      wsRef.current.close();
    }

    setStatus("connecting");
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setStatus("connected");

    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data as string) as WsEvent;
        handlerRef.current(event);
      } catch {
        // ignore malformed frames
      }
    };

    ws.onclose = () => {
      setStatus("disconnected");
      retryRef.current = setTimeout(connect, 3000);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return status;
}
