export type Platform = "instagram" | "facebook" | "x";

export type PostStatus =
  | "pending_approval"
  | "approved"
  | "ready_to_post"
  | "rejected"
  | "queued"
  | "publishing"
  | "published"
  | "failed";

export interface PostRecord {
  id: string;
  platform: Platform;
  status: PostStatus;
  caption: string | null;
  hashtags: string[];
  media_urls: string[];
  scheduled_for: Date | null;
  published_at: Date | null;
  platform_post_id: string | null;
  approved_by: string | null;
  created_by_bot: string | null;
  retry_count: number;
  error_message: string | null;
  meta: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}
