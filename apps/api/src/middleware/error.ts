import type { Request, Response, NextFunction } from "express";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const message = err instanceof Error ? err.message : "Internal server error";
  const status = (err as { status?: number }).status ?? 500;
  console.error(JSON.stringify({ level: "error", message, ts: new Date().toISOString() }));
  res.status(status).json({ error: message });
}
