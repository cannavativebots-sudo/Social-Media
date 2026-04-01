import Anthropic from "@anthropic-ai/sdk";
import { BaseBot, type BotContext, type BotResult } from "../base/BaseBot.js";

export class SchedulerBot extends BaseBot {
  protected systemPrompt = `You are the Scheduler Bot. You manage the timing of social media posts.
When given posts to schedule, determine optimal posting times based on platform best practices:
- Instagram: weekdays 9–11am or 6–8pm (audience timezone)
- Facebook: weekdays 1–4pm

Use schedule_post to set scheduled_for times on approved posts.`;

  protected tools: Anthropic.Tool[] = [
    {
      name: "get_posts_to_schedule",
      description: "Get approved posts that don't have a scheduled time yet",
      input_schema: { type: "object" as const, properties: {}, required: [] },
    },
    {
      name: "schedule_post",
      description: "Set a scheduled publish time for an approved post",
      input_schema: {
        type: "object" as const,
        properties: {
          post_id: { type: "string" },
          scheduled_for: { type: "string", description: "ISO 8601 datetime" },
        },
        required: ["post_id", "scheduled_for"],
      },
    },
  ];

  protected async execute(context: BotContext): Promise<BotResult> {
    const response = await this.runAgenticLoop(context.task);
    return { success: true, message: response };
  }

  protected async handleToolCall(
    toolName: string,
    input: Record<string, unknown>
  ): Promise<unknown> {
    switch (toolName) {
      case "get_posts_to_schedule":
        return this.apiGet("/posts?status=approved");
      case "schedule_post": {
        // PATCH post with scheduled_for — extend posts route in Sprint 3
        const resp = await fetch(
          `${process.env.API_BASE_URL ?? "http://localhost:3001"}/api/v1/posts/${input.post_id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.API_SECRET_KEY ?? "",
            },
            body: JSON.stringify({ scheduled_for: input.scheduled_for }),
          }
        );
        return resp.json();
      }
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
