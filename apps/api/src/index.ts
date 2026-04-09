import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { config } from "./config.js";
import { router } from "./routes/index.js";
import { errorMiddleware } from "./middleware/error.js";
import { initWebSocketServer } from "./websocket/server.js";
import { startPublishWorker } from "./services/queue.js";

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: config.dashboardOrigin }));
app.use(express.json());
app.use("/static", express.static(path.join(__dirname, "../../../static")));

app.use("/api/v1", router);
app.use(errorMiddleware as express.ErrorRequestHandler);

initWebSocketServer(server);
startPublishWorker();

server.listen(config.port, () => {
  console.log(JSON.stringify({
    level: "info",
    message: `Digital Office API running on port ${config.port}`,
    ts: new Date().toISOString(),
  }));
});
