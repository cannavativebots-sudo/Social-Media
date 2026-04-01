import { BaseBot, type BotTool, type BotContext, type BotResult } from "../base/BaseBot.js";

export class FacebookBot extends BaseBot {
  protected systemPrompt = `You are the Facebook Bot. You handle publishing approved posts to the
Facebook Page via the Meta Graph API. Check for approved posts, publish them, and report results.`;

  protected tools: BotTool[] = [
    {
      name: "get_approved_posts",
      description: "Get Facebook posts approved and ready to publish",
      parameters: { type: "object" as const, properties: {}, required: [] },
    },
    {
      name: "publish_post",
      description: "Publish an approved post to the Facebook Page",
      parameters: {
        type: "object" as const,
        properties: {
          post_id: { type: "string" },
        },
        required: ["post_id"],
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
      case "get_approved_posts":
        return this.apiGet("/posts?platform=facebook&status=approved");
      case "publish_post":
        // TODO Sprint 3: wire up MetaApiService.publishFacebookPost
        return { message: `Publishing post ${input.post_id} to Facebook (stub)` };
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
