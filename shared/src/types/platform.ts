export type PlatformName = "instagram" | "facebook" | "x" | "website";

export interface PlatformConnection {
  id: string;
  platform: PlatformName;
  is_connected: boolean;
  account_id: string | null;
  account_name: string | null;
  last_checked: Date | null;
  error_message: string | null;
  meta: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}
