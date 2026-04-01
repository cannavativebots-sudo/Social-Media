import Anthropic from "@anthropic-ai/sdk";
import { BaseBot, type BotContext, type BotResult } from "../base/BaseBot.js";
import type { PostRecord } from "digital-office-shared";

export class ContentCreatorBot extends BaseBot {
  protected systemPrompt = `You are a professional social media content creator for a cannabis brand.
Your job is to write engaging, authentic captions and select relevant hashtags for Instagram and Facebook posts.

Guidelines:
- Keep Instagram captions under 2,200 characters; lead with a hook in the first line
- Facebook posts can be slightly longer and more conversational
- Hashtags: 10–15 for Instagram, 3–5 for Facebook
- Tone: warm, knowledgeable, community-focused — never clinical or salesy
- Always comply with platform rules: no medical claims, no purchase solicitation
- Use the get_recent_posts tool first to avoid repeating recent content
- Use save_content to save your final post to the queue

When given a topic or theme, produce one post per platform requested.`;

  protected tools: Anthropic.Tool[] = [
    {
      name: "get_recent_posts",
      description: "Retrieve recent published posts to avoid repeating content",
      input_schema: {
        type: "object" as const,
        properties: {
          platform: {
            type: "string",
            enum: ["instagram", "facebook"],
            description: "Which platform to check",
          },
          limit: {
            type: "number",
            description: "How many recent posts to retrieve (default 5)",
          },
        },
        required: ["platform"],
      },
    },
    {
      name: "save_content",
      description: "Save a generated post to the approval queue",
      input_schema: {
        type: "object" as const,
        properties: {
          platform: {
            type: "string",
            enum: ["instagram", "facebook"],
          },
          caption: {
            type: "string",
            description: "The full post caption",
          },
          hashtags: {
            type: "array",
            items: { type: "string" },
            description: "Hashtags WITHOUT the # symbol",
          },
          scheduled_for: {
            type: "string",
            description: "ISO 8601 datetime to schedule the post, or omit for manual approval",
          },
        },
        required: ["platform", "caption", "hashtags"],
      },
    },
  ];

  protected async execute(context: BotContext): Promise<BotResult> {
    const response = await this.runAgenticLoop(context.task);
    return {
      success: true,
      message: response || "Content created and saved to queue.",
    };
  }

  protected async handleToolCall(
    toolName: string,
    input: Record<string, unknown>
  ): Promise<unknown> {
    switch (toolName) {
      case "get_recent_posts": {
        const platform = input.platform as string;
        const limit = (input.limit as number | undefined) ?? 5;
        const posts = await this.apiGet<PostRecord[]>(
          `/posts?platform=${platform}&status=published&limit=${limit}`
        );
        return posts.map((p) => ({
          caption: p.caption,
          hashtags: p.hashtags,
          published_at: p.published_at,
        }));
      }

      case "save_content": {
        const post = await this.apiPost<PostRecord>("/posts", {
          platform: input.platform,
          caption: input.caption,
          hashtags: input.hashtags,
          scheduled_for: (input.scheduled_for as string | undefined) ?? null,
          created_by_bot: this.role,
        });
        await this.logger.info("Post saved to queue", {
          id: post.id,
          platform: post.platform,
          status: post.status,
        });
        return { id: post.id, status: post.status };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
