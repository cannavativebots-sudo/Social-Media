import { BaseBot, type BotTool, type BotContext, type BotResult } from "../base/BaseBot.js";

/**
 * X (Twitter) Bot — DISABLED, Phase 2
 * Credentials not set up yet. This bot will always return a disabled message.
 */
export class XBot extends BaseBot {
  protected systemPrompt = "X Bot is not yet configured.";
  protected tools: BotTool[] = [];

  protected async execute(_context: BotContext): Promise<BotResult> {
    return {
      success: false,
      message: "X Bot is disabled — X/Twitter integration is Phase 2.",
    };
  }

  protected async handleToolCall(_toolName: string, _input: Record<string, unknown>): Promise<unknown> {
    return { error: "X Bot is disabled" };
  }
}
