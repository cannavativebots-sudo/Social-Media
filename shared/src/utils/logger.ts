import type { LogLevel } from "../types/log.js";

export function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(context ? { context } : {}),
  };
  const output = JSON.stringify(entry);
  if (level === "error") {
    console.error(output);
  } else {
    console.log(output);
  }
}
