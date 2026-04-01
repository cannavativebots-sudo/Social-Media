import type { FunctionDeclaration, Tool } from "@google/generative-ai";
import type { BotRole, BotStatus, BotContext, BotResult } from "digital-office-shared";
import { getGeminiClient, DEFAULT_MODEL } from "./ClaudeClient.js";
import { BotLogger } from "./BotLogger.js";

export type { BotContext, BotResult };

export interface BotTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:3001";
const API_KEY  = process.env.API_SECRET_KEY ?? "";

export abstract class BaseBot {
  protected readonly role: BotRole;
  protected readonly name: string;
  protected readonly logger: BotLogger;

  /** Subclasses declare their tools here */
  protected abstract tools: BotTool[];

  /** System prompt that defines this bot's personality and responsibilities */
  protected abstract systemPrompt: string;

  constructor(role: BotRole, name: string) {
    this.role   = role;
    this.name   = name;
    this.logger = new BotLogger(role);
  }

  /** Entry point — wraps execute() with status reporting */
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

  /** Core agentic tool-use loop using Gemini */
  protected async runAgenticLoop(userMessage: string): Promise<string> {
    const gemini = getGeminiClient();

    const geminiFunctions = this.tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: {
        type: "OBJECT" as const,
        properties: t.parameters.properties as Record<string, { type: string; description?: string }>,
        required: t.parameters.required ?? [],
      },
    }));

    const geminiTools: Tool[] = geminiFunctions.length > 0
      ? [{ functionDeclarations: geminiFunctions as FunctionDeclaration[] }]
      : [];

    const model = gemini.getGenerativeModel({
      model: DEFAULT_MODEL,
      systemInstruction: this.systemPrompt,
      tools: geminiTools,
    });

    const chat = model.startChat();
    let message: string | { functionResponse: { name: string; response: unknown } }[] = userMessage;

    while (true) {
      const result = await chat.sendMessage(message as string);
      const response = result.response;
      const functionCalls = response.functionCalls();

      await this.logger.debug("Gemini response", {
        finish_reason: response.candidates?.[0]?.finishReason,
        tool_calls: functionCalls?.map((c) => c.name) ?? [],
      });

      if (!functionCalls || functionCalls.length === 0) {
        return response.text();
      }

      const functionResponses: { functionResponse: { name: string; response: unknown } }[] = [];
      for (const call of functionCalls) {
        await this.logger.info(`Tool call: ${call.name}`, { input: call.args });

        let callResult: unknown;
        try {
          callResult = await this.handleToolCall(call.name, call.args as Record<string, unknown>);
        } catch (err) {
          callResult = { error: err instanceof Error ? err.message : String(err) };
          await this.logger.warn(`Tool error: ${call.name}`, { error: callResult });
        }

        functionResponses.push({ functionResponse: { name: call.name, response: callResult } });
      }

      message = functionResponses;
    }
  }

  /** Subclasses implement their domain logic using runAgenticLoop */
  protected abstract execute(context: BotContext): Promise<BotResult>;

  /** Subclasses handle their specific tool calls */
  protected abstract handleToolCall(
    toolName: string,
    input: Record<string, unknown>
  ): Promise<unknown>;

  /** Report status back to the API */
  protected async reportStatus(status: BotStatus, errorMessage?: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/api/v1/bots/${this.role}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify({ status, error_message: errorMessage ?? null }),
      });
    } catch {
      // Don't crash bot if API is unreachable
    }
  }

  /** Helper: POST to the API */
  protected async apiPost<T>(path: string, body: unknown): Promise<T> {
    const resp = await fetch(`${API_BASE}/api/v1${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`API POST ${path} failed (${resp.status}): ${text}`);
    }
    return resp.json() as Promise<T>;
  }

  /** Helper: GET from the API */
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
