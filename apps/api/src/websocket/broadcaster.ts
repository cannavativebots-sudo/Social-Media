import { WebSocket, WebSocketServer } from "ws";
import type { WsEvent } from "digital-office-shared";

let wss: WebSocketServer | null = null;

export function initBroadcaster(server: WebSocketServer) {
  wss = server;
}

export function broadcast(event: WsEvent) {
  if (!wss) return;
  const payload = JSON.stringify(event);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}
