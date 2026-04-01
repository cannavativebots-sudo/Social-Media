import { Router } from "express";
import { db } from "../db/client.js";
import { broadcast } from "../websocket/broadcaster.js";
import { BotRunner } from "../services/bot-runner.js";
import type { BotRole } from "digital-office-shared";

export const botsRouter = Router();

// GET /api/v1/bots
botsRouter.get("/", async (_req, res, next) => {
  try {
    const { rows } = await db.query("SELECT * FROM bots ORDER BY role");
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/bots/:role
botsRouter.get("/:role", async (req, res, next) => {
  try {
    const { rows } = await db.query("SELECT * FROM bots WHERE role = $1", [req.params.role]);
    if (!rows[0]) { res.status(404).json({ error: "Bot not found" }); return; }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/bots/:role/status  (called by bots to report status)
botsRouter.patch("/:role/status", async (req, res, next) => {
  try {
    const { status, error_message } = req.body;
    const { rows } = await db.query(
      `UPDATE bots SET status = $1, error_msg = $2,
        last_run_at = CASE WHEN $1 = 'running' THEN NOW() ELSE last_run_at END
       WHERE role = $3 RETURNING *`,
      [status, error_message ?? null, req.params.role]
    );
    if (!rows[0]) { res.status(404).json({ error: "Bot not found" }); return; }
    broadcast({ type: "BOT_STATUS_CHANGED", botId: req.params.role, status, ts: Date.now() });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/bots/:role/trigger  (manually trigger a bot)
botsRouter.post("/:role/trigger", async (req, res, next) => {
  try {
    const { role } = req.params;
    const { payload } = req.body ?? {};

    const { rows } = await db.query("SELECT * FROM bots WHERE role = $1", [role]);
    if (!rows[0]) { res.status(404).json({ error: "Bot not found" }); return; }
    if (!rows[0].is_enabled) { res.status(400).json({ error: "Bot is disabled" }); return; }
    if (rows[0].status === "running") { res.status(409).json({ error: "Bot already running" }); return; }

    await db.query("UPDATE bots SET status = 'running', last_run_at = NOW() WHERE role = $1", [role]);
    broadcast({ type: "BOT_STATUS_CHANGED", botId: role, status: "running", ts: Date.now() });

    BotRunner.trigger(role as BotRole, payload ?? {});

    res.json({ ok: true, message: `Bot ${role} triggered` });
  } catch (err) {
    next(err);
  }
});
