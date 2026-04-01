import type { Request, Response, NextFunction } from "express";
import { config } from "../config.js";

export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["x-api-key"];
  if (key !== config.apiSecretKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
