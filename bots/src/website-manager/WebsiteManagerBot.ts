import Anthropic from "@anthropic-ai/sdk";
import { BaseBot, type BotContext, type BotResult } from "../base/BaseBot.js";

/**
 * Website Manager Bot — DISABLED, Phase 2
 */
export class WebsiteManagerBot extends BaseBot {
  protected systemPrompt = "Website Manager Bot is not yet configured.";
  protected tools: Anthropic.Tool[] = [];

  protected async execute(_context: BotContext): Promise<BotResult> {
    return {
      success: false,
      message: "Website Manager Bot is disabled — website integration is Phase 2.",
    };
  }

  protected async handleToolCall(_toolName: string, _input: Record<string, unknown>): Promise<unknown> {
    return { error: "Website Manager Bot is disabled" };
  }
}
