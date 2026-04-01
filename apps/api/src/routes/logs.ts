import { Router } from "express";
import { db } from "../db/client.js";
import { broadcast } from "../websocket/broadcaster.js";

export const logsRouter = Router();

// GET /api/v1/logs
logsRouter.get("/", async (req, res, next) => {
  try {
    const { bot_role, level, limit = "50", offset = "0" } = req.query as Record<string, string>;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (bot_role) { params.push(bot_role); conditions.push(`bot_role = $${params.length}`); }
    if (level)    { params.push(level);    conditions.push(`level = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const { rows } = await db.query(
      `SELECT * FROM logs ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/logs  (bots write logs here)
logsRouter.post("/", async (req, res, next) => {
  try {
    const { level, bot_role, message, context = {} } = req.body;
    const { rows } = await db.query(
      "INSERT INTO logs (level, bot_role, message, context) VALUES ($1, $2, $3, $4) RETURNING *",
      [level, bot_role ?? null, message, context]
    );
    broadcast({ type: "LOG_ENTRY", entry: rows[0], ts: Date.now() });
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});
