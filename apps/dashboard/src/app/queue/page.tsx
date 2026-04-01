"use client";

import { useEffect, useState, useCallback } from "react";
import { PostQueueItem } from "@/components/PostQueueItem";
import { useQueue } from "@/hooks/useQueue";
import { registerWsHandler } from "../shell";
import type { PostRecord, PostStatus } from "digital-office-shared";

const FILTERS: { label: string; value: PostStatus | "all" }[] = [
  { label: "Pending",   value: "pending_approval" },
  { label: "All",       value: "all" },
  { label: "Queued",    value: "queued" },
  { label: "Published", value: "published" },
  { label: "Failed",    value: "failed" },
];

export default function QueuePage() {
  const { posts, loading, handleWsEvent } = useQueue();
  const [filter, setFilter] = useState<PostStatus | "all">("pending_approval");
  const [local, setLocal] = useState<PostRecord[]>([]);

  useEffect(() => setLocal(posts), [posts]);
  useEffect(() => registerWsHandler(handleWsEvent), [handleWsEvent]);

  function onUpdate(updated: PostRecord) {
    setLocal((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  const visible =
    filter === "all" ? local : local.filter((p) => p.status === filter);

  const pendingCount = local.filter((p) => p.status === "pending_approval").length;

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white">Post Queue</h1>
        {pendingCount > 0 && (
          <p className="text-sm text-yellow-400 mt-0.5">{pendingCount} awaiting approval</p>
        )}
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
              filter === f.value
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {f.label}
            {f.value === "pending_approval" && pendingCount > 0 && (
              <span className="ml-1.5 bg-yellow-500 text-black rounded-full px-1.5 py-0.5 text-xs font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-gray-600">No posts</p>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((p) => (
            <PostQueueItem key={p.id} post={p} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
