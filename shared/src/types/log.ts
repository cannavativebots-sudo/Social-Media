export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntry {
  id: string;
  level: LogLevel;
  bot_role: string | null;
  message: string;
  context: Record<string, unknown>;
  created_at: Date;
}
