export type { WsEvent } from "digital-office-shared";

export const WS_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_WS_URL ??
        `ws://${window.location.hostname}:3001`)
    : "ws://localhost:3001";
