import { Router } from "express";
import { getPageFansOnline, getPostEngagementInsights } from "../services/meta-api.js";

export const insightsRouter = Router();

// GET /api/v1/insights/facebook/fans-online
// Returns hourly fan activity data — used by MarketingStrategistBot to find best posting times
insightsRouter.get("/facebook/fans-online", async (_req, res, next) => {
  try {
    const data = await getPageFansOnline();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/insights/facebook/post-engagement?limit=25
// Returns recent posts with engagement metrics (likes, comments, shares, reach)
insightsRouter.get("/facebook/post-engagement", async (req, res, next) => {
  try {
    const limit = parseInt((req.query.limit as string) ?? "25", 10);
    const data = await getPostEngagementInsights(limit);
    res.json(data);
  } catch (err) {
    next(err);
  }
});
