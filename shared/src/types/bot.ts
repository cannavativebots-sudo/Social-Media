export type BotRole =
  | "director"
  | "social_media_manager"
  | "instagram"
  | "facebook"
  | "x"
  | "content_creator"
  | "scheduler"
  | "website_manager";

export type BotStatus = "idle" | "running" | "error" | "disabled";

export interface BotRecord {
  id: string;
  role: BotRole;
  name: string;
  status: BotStatus;
  last_run_at: Date | null;
  error_message: string | null;
  is_enabled: boolean;
  config: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}
