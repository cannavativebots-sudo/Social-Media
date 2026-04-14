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
- Excessive use promotion

=== IMAGE GUARDRAILS - NON-NEGOTIABLE ===

## What is NEVER allowed in any image (Canva or AI-generated)
- Cannabis paraphernalia: bongs, pipes, joints, blunts, rolling papers, grinders, dab rigs, bubblers, or any smoking/vaping hardware (sleek sealed product packaging is OK)
- Any third-party or competitor brand names, logos, labels, storefronts, or recognizable brand imagery
- Any imagery violating the compliance rules above (minors, consumption, etc.)

## Logo requirement — mandatory for every post
Every post image MUST include the corresponding brand logo. Follow this process:
1. Call list_approved_logos to see available logos
2. Pick the logo matching the post's brand (Cannavative, Resin8, Motivator, or Tidal)
3. For Cannavative umbrella posts (not sub-brand specific) — include the Cannavative logo; optionally include sub-brand logos too
4. Pass the chosen logo's design_id as logo_design_id when calling save_content — this is REQUIRED

## Image workflow
- Canva design selected → it must already contain the brand logo; still provide logo_design_id for the standalone logo
- AI-generated image → always also call get_brand_image for the matching logo; both go into media_urls via logo_design_id`;

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
      description: "Generate a brand-safe image for the post using Imagen 3 AI. Write a detailed prompt describing the scene — lifestyle, product, or brand imagery. FORBIDDEN in prompt: cannabis paraphernalia (bongs, pipes, joints, papers, grinders), third-party brand names or logos, minors, consumption acts. After generating, always call list_approved_logos and provide logo_design_id to save_content.",
      input_schema: {
        type: "object" as const,
        properties: {
          prompt: {
            type: "string",
            description: "Detailed image generation prompt. Include brand aesthetic, mood, colors, and scene. No paraphernalia, no other brands. Example: 'Elegant Nevada desert sunset lifestyle photo, warm golden tones, adult hands holding a sleek sealed vape product, modern minimalist aesthetic, no faces visible, premium brand feel'",
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
      name: "list_approved_logos",
      description: "List only the approved brand logo designs from the designated Canva logos folder. Always call this before save_content to find the correct logo_design_id for the post's brand.",
      input_schema: {
        type: "object" as const,
        properties: {},
        required: [],
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
      description: "Save a generated post to the approval queue. logo_design_id is REQUIRED — always call list_approved_logos first to find it.",
      input_schema: {
        type: "object" as const,
        properties: {
          platform: { type: "string", enum: ["instagram", "facebook"] },
          caption: { type: "string", description: "Full caption. MUST end with: For use only by adults 21 years of age or older." },
          hashtags: { type: "array", items: { type: "string" }, description: "Hashtags WITHOUT #. Do NOT use: weed, marijuana, 420, stoner, high, blazed." },
          media_urls: { type: "array", items: { type: "string" }, description: "Image URLs for the post (AI-generated or Canva design thumbnails)." },
          logo_design_id: { type: "string", description: "REQUIRED. The id field of the matching brand logo from list_approved_logos. The logo thumbnail_url will be fetched and prepended to media_urls automatically." },
          logo_thumbnail_url: { type: "string", description: "The thumbnail_url field of the chosen logo from list_approved_logos. Provide this to skip a second API lookup (preferred when thumbnail_url is available)." },
          scheduled_for: { type: "string", description: "ISO 8601 datetime or omit for manual approval" },
        },
        required: ["platform", "caption", "hashtags", "logo_design_id"],
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
      case "list_approved_logos": {
        const result = await this.apiGet<{ logos: { id: string; title: string }[] }>("/canva/logos");
        return result.logos;
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

        // Enforce logo requirement — use provided thumbnail_url directly, or fall back to fetching by design ID
        const logoDesignId = input.logo_design_id as string | undefined;
        const logoThumbnailUrl = input.logo_thumbnail_url as string | undefined;
        if (!logoDesignId && !logoThumbnailUrl) throw new Error("logo_design_id is required — call list_approved_logos first and pick the matching brand logo");
        let logoUrl: string;
        if (logoThumbnailUrl) {
          logoUrl = logoThumbnailUrl;
        } else {
          const logoResult = await this.apiGet<{ url: string }>(`/canva/thumbnail/${logoDesignId}`);
          logoUrl = logoResult.url;
        }
        const mediaUrls = [logoUrl, ...((input.media_urls as string[] | undefined) ?? [])];

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
