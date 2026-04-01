"use client";

import { useState } from "react";
import clsx from "clsx";
import { CheckCircle, XCircle, Instagram, Facebook, ExternalLink } from "lucide-react";
import { approvePost, rejectPost } from "@/lib/api";
import type { PostRecord } from "digital-office-shared";

const STATUS_STYLES: Record<string, string> = {
  pending_approval: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  approved:         "bg-blue-500/15 text-blue-300 border-blue-500/30",
  rejected:         "bg-gray-700 text-gray-400 border-gray-600",
  queued:           "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  publishing:       "bg-purple-500/15 text-purple-300 border-purple-500/30",
  published:        "bg-green-500/15 text-green-300 border-green-500/30",
  failed:           "bg-red-500/15 text-red-400 border-red-500/30",
};

const PlatformIcon = ({ platform }: { platform: string }) =>
  platform === "instagram" ? (
    <Instagram className="w-3.5 h-3.5" />
  ) : (
    <Facebook className="w-3.5 h-3.5" />
  );

export function PostQueueItem({
  post,
  onUpdate,
}: {
  post: PostRecord;
  onUpdate: (updated: PostRecord) => void;
}) {
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);

  async function handle(action: "approve" | "reject") {
    setBusy(action);
    try {
      const updated = action === "approve" ? await approvePost(post.id) : await rejectPost(post.id);
      onUpdate(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <PlatformIcon platform={post.platform} />
          <span className="capitalize">{post.platform}</span>
          {post.scheduled_for && (
            <span className="text-gray-600">· {new Date(post.scheduled_for).toLocaleString()}</span>
          )}
        </div>
        <span className={clsx("text-xs px-2 py-0.5 rounded-full border font-medium", STATUS_STYLES[post.status])}>
          {post.status.replace("_", " ")}
        </span>
      </div>

      {post.caption && (
        <p className="text-sm text-gray-200 line-clamp-3">{post.caption}</p>
      )}

      {post.hashtags.length > 0 && (
        <p className="text-xs text-indigo-400 truncate">
          {post.hashtags.map((h) => `#${h}`).join(" ")}
        </p>
      )}

      {post.error_message && (
        <p className="text-xs text-red-400 bg-red-500/10 rounded p-2">{post.error_message}</p>
      )}

      {post.platform_post_id && (
        <div className="flex items-center gap-1 text-xs text-green-400">
          <ExternalLink className="w-3 h-3" />
          <span className="font-mono truncate">{post.platform_post_id}</span>
        </div>
      )}

      {post.status === "pending_approval" && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => handle("approve")}
            disabled={busy !== null}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded bg-green-600 hover:bg-green-500 text-white font-medium disabled:opacity-50 transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {busy === "approve" ? "Approving…" : "Approve"}
          </button>
          <button
            onClick={() => handle("reject")}
            disabled={busy !== null}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium disabled:opacity-50 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            {busy === "reject" ? "Rejecting…" : "Reject"}
          </button>
        </div>
      )}

      <p className="text-xs text-gray-600">
        {post.created_by_bot && <span>by {post.created_by_bot} · </span>}
        {new Date(post.created_at).toLocaleString()}
      </p>
    </div>
  );
}
