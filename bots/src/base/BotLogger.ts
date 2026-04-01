import type { LogLevel } from "digital-office-shared";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:3001";
const API_KEY  = process.env.API_SECRET_KEY ?? "";

export class BotLogger {
  constructor(private readonly botRole: string) {}

  async log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): Promise<void> {
    // Always print locally
    console.log(JSON.stringify({ level, bot: this.botRole, message, context, ts: new Date().toISOString() }));

    // Best-effort: send to API (don't throw if API is unreachable)
    try {
      await fetch(`${API_BASE}/api/v1/logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify({
          level,
          bot_role: this.botRole,
          message,
          context: context ?? {},
        }),
      });
    } catch {
      // Swallow — logging should never crash a bot
    }
  }

  info(message: string, context?: Record<string, unknown>)  { return this.log("info",  message, context); }
  warn(message: string, context?: Record<string, unknown>)  { return this.log("warn",  message, context); }
  error(message: string, context?: Record<string, unknown>) { return this.log("error", message, context); }
  debug(message: string, context?: Record<string, unknown>) { return this.log("debug", message, context); }
}
