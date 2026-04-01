import express, { Router, type Request, type Response } from "express";
import crypto from "crypto";
import { config } from "../config.js";
import { db } from "../db/client.js";
import { broadcast } from "../websocket/broadcaster.js";
import { BotRunner } from "../services/bot-runner.js";
import type { BotRole } from "digital-office-shared";

export const openclawRouter = Router();

const VALID_BOT_ROLES = new Set<BotRole>([
  "director",
  "social_media_manager",
  "instagram",
  "facebook",
  "content_creator",
  "scheduler",
]);

/**
 * Verify OpenClaw HMAC-SHA256 signature.
 * OpenClaw sends: X-OpenClaw-Signature: sha256=<hex>
 * Signed over the raw request body using OPENCLAW_WEBHOOK_SECRET.
 */
function verifySignature(rawBody: Buffer, signatureHeader: string): boolean {
  if (!config.openclaw.webhookSecret) return false;
  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", config.openclaw.webhookSecret)
      .update(rawBody)
      .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}

// POST /api/v1/openclaw/webhook
// Receives events from OpenClaw.ai and triggers the appropriate bot.
// We use express.raw() here so we can verify the HMAC over the raw bytes
// before parsing JSON ourselves.
openclawRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    // 1. Verify signature
    const sig = req.headers["x-openclaw-signature"];
    if (typeof sig !== "string" || !verifySignature(req.body as Buffer, sig)) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    // 2. Parse body
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse((req.body as Buffer).toString("utf8"));
    } catch {
      res.status(400).json({ error: "Invalid JSON" });
      return;
    }

    const { event, bot_role, task, callback_id, ...rest } = payload as {
      event?: string;
      bot_role?: string;
      task?: string;
      callback_id?: string;
      [key: string]: unknown;
    };

    // 3. Validate bot_role
    if (!bot_role || !VALID_BOT_ROLES.has(bot_role as BotRole)) {
      res.status(400).json({ error: `Unknown or disabled bot_role: ${bot_role}` });
      return;
    }

    const role = bot_role as BotRole;

    // 4. Check bot is enabled and not already running
    const { rows } = await db.query(
      "SELECT status, is_enabled FROM bots WHERE role = $1",
      [role]
    );
    const bot = rows[0];
    if (!bot) {
      res.status(404).json({ error: "Bot not found" });
      return;
    }
    if (!bot.is_enabled) {
      res.status(400).json({ error: "Bot is disabled" });
      return;
    }
    if (bot.status === "running") {
      res.status(409).json({ error: "Bot already running" });
      return;
    }

    // 5. Mark running, broadcast, fire bot async
    await db.query(
      "UPDATE bots SET status = 'running', last_run_at = NOW() WHERE role = $1",
      [role]
    );
    broadcast({ type: "BOT_STATUS_CHANGED", botId: role, status: "running", ts: Date.now() });

    BotRunner.trigger(role, {
      task: task ?? `OpenClaw event '${event ?? "trigger"}' received`,
      callback_id,
      event,
      ...rest,
    });

    // 6. Respond immediately — bot runs async
    res.json({ ok: true, bot_role: role, callback_id: callback_id ?? null });
  }
);
