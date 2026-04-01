import { WebSocketServer } from "ws";
import type { IncomingMessage } from "http";
import type { Server } from "http";
import { initBroadcaster } from "./broadcaster.js";

export function initWebSocketServer(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  initBroadcaster(wss);

  wss.on("connection", (ws, req: IncomingMessage) => {
    console.log(JSON.stringify({ level: "info", message: "WS client connected", ip: req.socket.remoteAddress }));

    ws.on("close", () => {
      console.log(JSON.stringify({ level: "info", message: "WS client disconnected" }));
    });

    ws.on("error", (err) => {
      console.error(JSON.stringify({ level: "error", message: "WS error", error: err.message }));
    });

    // Send a welcome ping so the client knows it's connected
    ws.send(JSON.stringify({ type: "CONNECTED", ts: Date.now() }));
  });

  return wss;
}
