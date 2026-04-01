export interface BotContext {
  task: string;
  payload?: Record<string, unknown>;
}

export interface BotResult {
  success: boolean;
  message: string;
  data?: unknown;
}
