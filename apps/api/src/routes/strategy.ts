import { Router } from "express";
import { db } from "../db/client.js";

export const strategyRouter = Router();

// GET /api/v1/strategy-reports/latest
strategyRouter.get("/latest", async (_req, res, next) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM strategy_reports ORDER BY created_at DESC LIMIT 1"
    );
    if (!rows[0]) { res.status(404).json({ error: "No strategy report found" }); return; }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/strategy-reports
strategyRouter.get("/", async (_req, res, next) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM strategy_reports ORDER BY created_at DESC LIMIT 10"
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/strategy-reports
strategyRouter.post("/", async (req, res, next) => {
  try {
    const { report, summary, created_by_bot } = req.body;
    const { rows } = await db.query(
      "INSERT INTO strategy_reports (report, summary, created_by_bot) VALUES ($1, $2, $3) RETURNING *",
      [JSON.stringify(report), summary ?? null, created_by_bot ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});
