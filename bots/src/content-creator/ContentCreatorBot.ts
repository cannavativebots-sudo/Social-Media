import Anthropic from "@anthropic-ai/sdk";
import { BaseBot, type BotContext, type BotResult } from "../base/BaseBot.js";
import type { PostRecord } from "digital-office-shared";

export class ContentCreatorBot extends BaseBot {
  protected systemPrompt = `You are a professional social media content creator for Cannavative, a licensed adult-use brand regulated by the Nevada Cannabis Compliance Board (CCB).

=== COMPLIANCE RULES - NON-NEGOTIABLE ===

## NEVADA CCB (NCCR) REQUIREMENTS
- EVERY post MUST end with this exact disclaimer on its own line: "For use only by adults 21 years of age or older."
- NEVER: make health, medical, or therapeutic claims of any kind
- NEVER: state or imply products treat, cure, or alleviate any condition
- NEVER: use anthropomorphic characters or cartoon imagery appealing to minors
- NEVER: target or appeal to persons under 21
- NEVER: make false or misleading statements
- NEVER: promote excessive or irresponsible use
- NEVER: normalize driving while impaired
- NEVER: show consumption in public places where prohibited

## FACEBOOK / META RULES
- NEVER: directly promote or solicit the sale of products
- NEVER: use CTAs like buy now, shop, purchase, order
- NEVER: make medical or health claims
- FOCUS: brand values, community, education, culture, lifestyle
- AVOID: explicit product promotion language

## INSTAGRAM RULES
- Algorithm deprioritizes explicit cannabis keywords - prefer lifestyle angles
- BANNED hashtags (never use): weed, marijuana, 420, stoner, high, blazed, pot, dank
- PREFERRED: brand, community, wellness lifestyle, Nevada/LasVegas local, adultuse

=== CONTENT GUIDELINES ===

## Format
- Instagram: under 2,200 chars; strong hook first line; 10-15 hashtags
- Facebook: slightly longer, conversational; 3-5 hashtags
- Tone: warm, knowledgeable, community-focused - never clinical or salesy
- Always check recent posts first to avoid repeating content

## Approved Themes
- Brand story, values, mission
- Team and community stories
- Educational content about the industry (responsible use, product types)
- Nevada adult-use culture and lifestyle
- Behind-the-scenes operations
- Partnerships and local community involvement

## Canva Brand Design Map
When choosing a design for a post, use list_canva_designs and pick the most recently updated one relevant to the brand.
If the post is about Cannavative brand overall → pick the most recent design.
If the post is about a specific sub-brand (Resin8, Motivator, Tidal) → pick a recently updated design and note the brand name.
Always call list_canva_designs first, then get_brand_image with the chosen design_id.

## Prohibited Themes
- Direct pricing or promotions
- Medical benefit language
- Content appealing to minors
- Impaired-driving normalization
- Public consumption promotion
- Excessive use promotion`;

  // Fallback brand image URLs — used only if Canva has no matching design
  private static readonly FALLBACK_IMAGES: Record<string, string> = {
    cannavative: "https://i.ibb.co/KpD87wgS/cannavative-logo-centered-15.png",
    motivator:   "https://i.ibb.co/NgKmrbBP/motivator-by-cannavative-logo-black.png",
    resin8:      "https://i.ibb.co/fYcbCTkv/R8-Black.png",
    tidal:       "https://i.ibb.co/BVDRWy3w/Tidal.png",
  };

  protected tools: Anthropic.Tool[] = [
    {
      name: "get_recent_posts",
      description: "Retrieve recent published posts to avoid repeating content",
      input_schema: {
        type: "object" as const,
        properties: {
          platform: { type: "string", enum: ["instagram", "facebook"], description: "Which platform to check" },
          limit: { type: "number", description: "How many recent posts to retrieve (default 5)" },
        },
        required: ["platform"],
      },
    },
    {
      name: "generate_image",
      description: "Generate a brand-safe image for the post using Imagen 3 AI. Write a detailed prompt describing the scene — lifestyle, product, or brand imagery. Never show consumption, minors, or anything violating compliance rules. Use this as the primary way to get images for posts.",
      input_schema: {
        type: "object" as const,
        properties: {
          prompt: {
            type: "string",
            description: "Detailed image generation prompt. Include brand aesthetic, mood, colors, and scene. Example: 'Elegant Nevada desert sunset lifestyle photo, warm golden tones, adult hands holding a sleek vape product, modern minimalist aesthetic, no faces visible, premium brand feel'",
          },
          filename: {
            type: "string",
            description: "Short slug for the filename, e.g. 'cannavative-lifestyle' or 'resin8-product'",
          },
        },
        required: ["prompt"],
      },
    },
    {
      name: "list_canva_designs",
      description: "List all available designs in the Canva account. Use this to discover design titles before calling get_brand_image.",
      input_schema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "get_brand_image",
      description: "Get a Canva design image URL by design_id (from list_canva_designs). Use the brand design map first — if no match, call list_canva_designs and pick the most recently updated design.",
      input_schema: {
        type: "object" as const,
        properties: {
          design_id: {
            type: "string",
            description: "Canva design ID from list_canva_designs or the brand design map",
          },
        },
        required: ["design_id"],
      },
    },
    {
      name: "save_content",
      description: "Save a generated post to the approval queue",
      input_schema: {
        type: "object" as const,
        properties: {
          platform: { type: "string", enum: ["instagram", "facebook"] },
          caption: { type: "string", description: "Full caption. MUST end with: For use only by adults 21 years of age or older." },
          hashtags: { type: "array", items: { type: "string" }, description: "Hashtags WITHOUT #. Do NOT use: weed, marijuana, 420, stoner, high, blazed." },
          media_urls: { type: "array", items: { type: "string" }, description: "Image URLs for the post. Required for Instagram — use get_brand_image first." },
          scheduled_for: { type: "string", description: "ISO 8601 datetime or omit for manual approval" },
        },
        required: ["platform", "caption", "hashtags"],
      },
    },
  ];

  protected async execute(context: BotContext): Promise<BotResult> {
    const response = await this.runAgenticLoop(context.task);
    return { success: true, message: response || "Content created and saved to queue." };
  }

  protected async handleToolCall(toolName: string, input: Record<string, unknown>): Promise<unknown> {
    switch (toolName) {
      case "get_recent_posts": {
        const platform = input.platform as string;
        const limit = (input.limit as number | undefined) ?? 5;
        const posts = await this.apiGet<PostRecord[]>(`/posts?platform=${platform}&status=published&limit=${limit}`);
        return posts.map((p) => ({ caption: p.caption, hashtags: p.hashtags, published_at: p.published_at }));
      }
      case "generate_image": {
        const { prompt, filename } = input as { prompt: string; filename?: string };
        const result = await this.apiPost<{ url: string }>("/images/generate", { prompt, filename });
        return { url: result.url };
      }
      case "list_canva_designs": {
        const result = await this.apiGet<{ designs: { id: string; title: string }[] }>("/canva/designs");
        return result.designs;
      }
      case "get_brand_image": {
        const { design_id } = input as { design_id: string };
        try {
          const result = await this.apiGet<{ url: string }>(`/canva/thumbnail/${design_id}`);
          return { url: result.url, source: "canva" };
        } catch {
          return { url: ContentCreatorBot.FALLBACK_IMAGES.cannavative, source: "fallback" };
        }
      }
      case "save_content": {
        const rawCaption = (input.caption as string).trim();
        const disclaimer = "For use only by adults 21 years of age or older.";
        const finalCaption = rawCaption.includes(disclaimer) ? rawCaption : `${rawCaption}\n\n${disclaimer}`;
        const bannedTags = ["weed","marijuana","420","stoner","high","blazed","pot","dank"];
        const hashtags = (input.hashtags as string[]).filter((h) => !bannedTags.includes(h.toLowerCase()));
        const mediaUrls = (input.media_urls as string[] | undefined) ?? [];
        const post = await this.apiPost<PostRecord>("/posts", {
          platform: input.platform,
          caption: finalCaption,
          hashtags,
          media_urls: mediaUrls,
          scheduled_for: (input.scheduled_for as string | undefined) ?? null,
          created_by_bot: this.role,
        });
        await this.logger.info("Post saved to queue", { id: post.id, platform: post.platform, status: post.status });
        return { id: post.id, status: post.status };
      }
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
