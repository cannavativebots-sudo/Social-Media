"use client";

import { useEffect, useState, useCallback } from "react";
import { getPosts } from "@/lib/api";
import type { PostRecord, WsEvent } from "digital-office-shared";

export function useQueue() {
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load pending_approval + queued + publishing to give the full picture
    getPosts()
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleWsEvent = useCallback((event: WsEvent) => {
    switch (event.type) {
      case "POST_QUEUED":
        setPosts((prev) => [event.post, ...prev]);
        break;
      case "POST_APPROVED":
        setPosts((prev) =>
          prev.map((p) => (p.id === event.postId ? { ...p, status: "approved" } : p))
        );
        break;
      case "POST_REJECTED":
        setPosts((prev) =>
          prev.map((p) => (p.id === event.postId ? { ...p, status: "rejected" } : p))
        );
        break;
      case "POST_PUBLISHED":
        setPosts((prev) =>
          prev.map((p) =>
            p.id === event.postId
              ? { ...p, status: "published", platform_post_id: event.platformPostId, published_at: new Date() }
              : p
          )
        );
        break;
      case "POST_FAILED":
        setPosts((prev) =>
          prev.map((p) =>
            p.id === event.postId ? { ...p, status: "failed", error_message: event.error } : p
          )
        );
        break;
    }
  }, []);

  return { posts, loading, handleWsEvent };
}
