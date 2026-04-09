import { Router } from "express";
import { db } from "../db/client.js";
import { broadcast } from "../websocket/broadcaster.js";

export const postsRouter = Router();

// GET /api/v1/posts
postsRouter.get("/", async (req, res, next) => {
  try {
    const { platform, status, limit = "20", offset = "0" } = req.query as Record<string, string>;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (platform) { params.push(platform); conditions.push(`platform = $${params.length}`); }
    if (status)   { params.push(status);   conditions.push(`status = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const { rows } = await db.query(
      `SELECT * FROM posts ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/posts  (bots create posts)
postsRouter.post("/", async (req, res, next) => {
  try {
    const { platform, caption, hashtags = [], media_urls = [], scheduled_for, created_by_bot, meta = {} } = req.body;
    const { rows } = await db.query(
      `INSERT INTO posts (platform, caption, hashtags, media_urls, scheduled_for, created_by_bot, meta)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [platform, caption, hashtags, media_urls, scheduled_for ?? null, created_by_bot ?? null, meta]
    );
    broadcast({ type: "POST_QUEUED", post: rows[0], ts: Date.now() });
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/posts/:id/approve
postsRouter.post("/:id/approve", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      "UPDATE posts SET status = 'ready_to_post' WHERE id = $1 AND status = 'pending_approval' RETURNING *",
      [id]
    );
    if (!rows[0]) { res.status(404).json({ error: "Post not found or not pending" }); return; }
    // No auto-publish — human manually posts then clicks "Mark as published"
    broadcast({ type: "POST_APPROVED", postId: id, ts: Date.now() });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/posts/:id/reject
postsRouter.post("/:id/reject", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      "UPDATE posts SET status = 'rejected' WHERE id = $1 RETURNING *",
      [id]
    );
    if (!rows[0]) { res.status(404).json({ error: "Post not found" }); return; }
    broadcast({ type: "POST_REJECTED", postId: id, ts: Date.now() });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/posts/:id/mark_published  (human confirms manual post went live)
postsRouter.post("/:id/mark_published", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      "UPDATE posts SET status = 'published', published_at = NOW() WHERE id = $1 RETURNING *",
      [id]
    );
    if (!rows[0]) { res.status(404).json({ error: "Post not found" }); return; }
    broadcast({ type: "POST_PUBLISHED", postId: id, platformPostId: "", ts: Date.now() });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});
