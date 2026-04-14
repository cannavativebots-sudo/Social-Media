import { Queue, Worker } from "bullmq";
import { config } from "../config.js";
import { db } from "../db/client.js";
import { broadcast } from "../websocket/broadcaster.js";
import { publishFacebookPost, publishInstagramPost } from "./meta-api.js";

const connection = { url: config.redisUrl };

export const publishQueue = new Queue("publish", { connection });

export function startPublishWorker() {
  const worker = new Worker(
    "publish",
    async (job) => {
      const { postId } = job.data as { postId: string };

      const { rows } = await db.query("SELECT * FROM posts WHERE id = $1", [postId]);
      const post = rows[0];
      if (!post) throw new Error(`Post ${postId} not found`);

      await db.query("UPDATE posts SET status = 'publishing' WHERE id = $1", [postId]);

      let platformPostId = "";
      if (post.platform === "facebook") {
        const imageUrl = post.media_urls?.[0] ?? undefined;
        platformPostId = await publishFacebookPost(post.caption, post.hashtags, imageUrl);
      } else if (post.platform === "instagram") {
        const imageUrl = post.media_urls?.[0] ?? undefined;
        platformPostId = await publishInstagramPost(post.caption, post.hashtags, imageUrl);
      } else {
        throw new Error(`Unsupported platform: ${post.platform}`);
      }

      await db.query(
        "UPDATE posts SET status = 'published', platform_post_id = $1, published_at = NOW() WHERE id = $2",
        [platformPostId, postId]
      );

      broadcast({ type: "POST_PUBLISHED", postId, platformPostId, ts: Date.now() });
    },
    { connection }
  );

  worker.on("failed", async (job, err) => {
    if (!job) return;
    const { postId } = job.data as { postId: string };
    await db.query(
      "UPDATE posts SET status = 'failed', error_msg = $1 WHERE id = $2",
      [err.message, postId]
    );
    broadcast({ type: "POST_FAILED", postId, error: err.message, ts: Date.now() });
  });

  return worker;
}
