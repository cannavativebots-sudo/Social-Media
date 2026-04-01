import Anthropic from "@anthropic-ai/sdk";
import type { BotRole, BotStatus, BotContext, BotResult } from "digital-office-shared";
import { getClaudeClient, DEFAULT_MODEL, DEFAULT_MAX_TOKENS } from "./ClaudeClient.js";
import { BotLogger } from "./BotLogger.js";

export type { BotContext, BotResult };

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:3001";
const API_KEY  = process.env.API_SECRET_KEY ?? "";

export abstract class BaseBot {
  protected readonly role: BotRole;
  protected readonly name: string;
  protected readonly logger: BotLogger;
  protected readonly claude: Anthropic;

  protected abstract tools: Anthropic.Tool[];
  protected abstract systemPrompt: string;

  constructor(role: BotRole, name: string) {
    this.role   = role;
    this.name   = name;
    this.logger = new BotLogger(role);
    this.claude = getClaudeClient();
  }

  async run(context: BotContext): Promise<BotResult> {
    await this.reportStatus("running");
    await this.logger.info(`${this.name} starting`, { task: context.task });

    try {
      const result = await this.execute(context);
      await this.reportStatus("idle");
      await this.logger.info(`${this.name} finished`, { success: result.success });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.reportStatus("error", message);
      await this.logger.error(`${this.name} failed`, { error: message });
      throw err;
    }
  }

  protected async runAgenticLoop(userMessage: string): Promise<string> {
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: userMessage },
    ];

    while (true) {
      const response = await this.claude.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: DEFAULT_MAX_TOKENS,
        system: this.systemPrompt,
        tools: this.tools,
        messages,
      });

      await this.logger.debug("Claude response", {
        stop_reason: response.stop_reason,
        tool_calls: response.content
          .filter((b) => b.type === "tool_use")
          .map((b) => (b as Anthropic.ToolUseBlock).name),
      });

      if (response.stop_reason === "end_turn") {
        const textBlock = response.content.find((b) => b.type === "text");
        return textBlock?.type === "text" ? textBlock.text : "";
      }

      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;

        await this.logger.info(`Tool call: ${block.name}`, { input: block.input });

        let result: unknown;
        try {
          result = await this.handleToolCall(block.name, block.input as Record<string, unknown>);
        } catch (err) {
          result = { error: err instanceof Error ? err.message : String(err) };
          await this.logger.warn(`Tool error: ${block.name}`, { error: result });
        }

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }

      messages.push({ role: "user", content: toolResults });
    }
  }

  protected abstract execute(context: BotContext): Promise<BotResult>;

  protected abstract handleToolCall(
    toolName: string,
    input: Record<string, unknown>
  ): Promise<unknown>;

  protected async reportStatus(status: BotStatus, errorMessage?: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/api/v1/bots/${this.role}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
        body: JSON.stringify({ status, error_message: errorMessage ?? null }),
      });
    } catch {
      // Don't crash bot if API is unreachable
    }
  }

  protected async apiPost<T>(path: string, body: unknown): Promise<T> {
    const resp = await fetch(`${API_BASE}/api/v1${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`API POST ${path} failed (${resp.status}): ${text}`);
    }
    return resp.json() as Promise<T>;
  }

  protected async apiGet<T>(path: string): Promise<T> {
    const resp = await fetch(`${API_BASE}/api/v1${path}`, {
      headers: { "x-api-key": API_KEY },
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`API GET ${path} failed (${resp.status}): ${text}`);
    }
    return resp.json() as Promise<T>;
  }
}
