import Anthropic from "@anthropic-ai/sdk";
import { BaseBot, type BotContext, type BotResult } from "../base/BaseBot.js";

export class SocialMediaManagerBot extends BaseBot {
  protected systemPrompt = `You are the Social Media Manager. You oversee all social platform bots.
You coordinate between Instagram and Facebook bots to ensure consistent messaging across platforms.
Delegate platform-specific publishing tasks to the appropriate bot (instagram or facebook).
Review post queues and coordinate scheduling when directed.`;

  protected tools: Anthropic.Tool[] = [
    {
      name: "delegate_to_platform_bot",
      description: "Trigger a platform-specific bot",
      input_schema: {
        type: "object" as const,
        properties: {
          platform: { type: "string", enum: ["instagram", "facebook"] },
          task: { type: "string" },
        },
        required: ["platform", "task"],
      },
    },
    {
      name: "get_pending_posts",
      description: "Get posts waiting for approval or publishing",
      input_schema: {
        type: "object" as const,
        properties: {
          platform: { type: "string", enum: ["instagram", "facebook", "x"] },
        },
        required: [],
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
      case "delegate_to_platform_bot":
        return this.apiPost(`/bots/${input.platform}/trigger`, { payload: { task: input.task } });
      case "get_pending_posts": {
        const platform = input.platform ? `&platform=${input.platform}` : "";
        return this.apiGet(`/posts?status=pending_approval${platform}`);
      }
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
