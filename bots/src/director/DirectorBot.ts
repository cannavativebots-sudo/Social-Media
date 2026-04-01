import { BaseBot, type BotTool, type BotContext, type BotResult } from "../base/BaseBot.js";

export class DirectorBot extends BaseBot {
  protected systemPrompt = `You are the Director — the top-level orchestrator of the Digital Office.
You receive high-level objectives and decompose them into specific tasks for specialized bots.

Chain of command:
  Director → Social Media Manager → Instagram Bot / Facebook Bot
  Director → Content Creator (for generating post content)
  Director → Scheduler (for timing posts)

When given a task, determine which bot(s) should handle it and delegate using delegate_to_bot.
Use get_system_status to understand what bots are available before delegating.`;

  protected tools: BotTool[] = [
    {
      name: "get_system_status",
      description: "Get the current status of all bots and platform connections",
      parameters: { type: "object" as const, properties: {}, required: [] },
    },
    {
      name: "delegate_to_bot",
      description: "Trigger a specific bot to execute a task",
      parameters: {
        type: "object" as const,
        properties: {
          bot_role: {
            type: "string",
            enum: ["social_media_manager", "content_creator", "scheduler", "instagram", "facebook"],
          },
          task: { type: "string", description: "Clear task description for the bot" },
          payload: { type: "object", description: "Additional context/data for the bot" },
        },
        required: ["bot_role", "task"],
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
      case "get_system_status": {
        const [bots, platforms] = await Promise.all([
          this.apiGet("/bots"),
          this.apiGet("/platforms"),
        ]);
        return { bots, platforms };
      }
      case "delegate_to_bot": {
        return this.apiPost(`/bots/${input.bot_role}/trigger`, {
          payload: { task: input.task, ...(input.payload as object ?? {}) },
        });
      }
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
