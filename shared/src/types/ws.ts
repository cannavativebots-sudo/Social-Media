import type { BotStatus } from "./bot.js";
import type { PostRecord } from "./post.js";
import type { LogEntry } from "./log.js";
import type { PlatformName } from "./platform.js";

export type WsEvent =
  | { type: "BOT_STATUS_CHANGED"; botId: string; status: BotStatus; ts: number }
  | { type: "POST_QUEUED"; post: PostRecord; ts: number }
  | { type: "POST_APPROVED"; postId: string; ts: number }
  | { type: "POST_REJECTED"; postId: string; ts: number }
  | { type: "POST_PUBLISHED"; postId: string; platformPostId: string; ts: number }
  | { type: "POST_FAILED"; postId: string; error: string; ts: number }
  | { type: "LOG_ENTRY"; entry: LogEntry; ts: number }
  | { type: "PLATFORM_STATUS_CHANGED"; platform: PlatformName; connected: boolean; ts: number };
