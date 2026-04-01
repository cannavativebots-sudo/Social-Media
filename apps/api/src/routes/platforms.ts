import { Router } from "express";
import { db } from "../db/client.js";
import { broadcast } from "../websocket/broadcaster.js";

export const platformsRouter = Router();

// GET /api/v1/platforms
platformsRouter.get("/", async (_req, res, next) => {
  try {
    const { rows } = await db.query("SELECT * FROM platform_connections ORDER BY platform");
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/platforms/:platform
platformsRouter.patch("/:platform", async (req, res, next) => {
  try {
    const { platform } = req.params;
    const { is_connected, account_id, account_name, access_token, error_message } = req.body;

    const { rows } = await db.query(
      `UPDATE platform_connections
       SET is_connected = COALESCE($1, is_connected),
           account_id   = COALESCE($2, account_id),
           account_name = COALESCE($3, account_name),
           access_token = COALESCE($4, access_token),
           error_msg    = $5,
           last_checked = NOW()
       WHERE platform = $6 RETURNING *`,
      [is_connected ?? null, account_id ?? null, account_name ?? null, access_token ?? null, error_message ?? null, platform]
    );
    if (!rows[0]) { res.status(404).json({ error: "Platform not found" }); return; }

    broadcast({
      type: "PLATFORM_STATUS_CHANGED",
      platform: rows[0].platform,
      connected: rows[0].is_connected,
      ts: Date.now(),
    });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});
