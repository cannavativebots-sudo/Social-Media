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

## What is NEVER allowed in any image
- Cannabis paraphernalia: bongs, pipes, joints, blunts, rolling papers, grinders, dab rigs, bubblers
- ANY vaping or smoking device, pen, cartridge, hardware, or product equipment of ANY kind
- ANY text, words, brand names, or logos painted/printed ON objects within the scene
- Third-party or competitor brand names, logos, labels, storefronts, or recognizable brand imagery
- Any imagery violating the compliance rules above (minors, consumption, etc.)

## What AI-generated images MUST be
- Pure mainstream lifestyle scenes: people enjoying nature, fitness, socializing, travel, architecture, abstract art
- Imagine you are generating an image for a beverage or outdoor lifestyle brand — ZERO cannabis context
- NO cannabis plants, marijuana leaves, or any plant associated with cannabis — not even artistic or abstract versions
- NO references to the cannabis industry, grow operations, dispensaries, or cultivation — not even "behind the scenes"
- NO products, NO devices, NO packaging, NO hardware — describe the feeling and lifestyle only
- The brand logo will be composited onto the image automatically — do NOT try to include it in the prompt

## Logo requirement — mandatory for every post
1. Call list_approved_logos to see available logos
2. Pick the logo matching the post's brand (Cannavative, Resin8, Motivator, or Tidal)
3. After generating the image, call composite_logo_on_image with the image URL and logo thumbnail_url
4. Use the composited URL as the sole media_urls entry in save_content

## Image workflow (strictly in this order)
1. generate_image ONCE → get image_url (generate ONE image total, not one per platform)
2. list_approved_logos → pick the logo matching the post's brand → get logo thumbnail_url
3. composite_logo_on_image(image_url, logo_thumbnail_url) → get composited_url
4. Use that SAME composited_url in BOTH the Instagram and Facebook save_content calls
   - Do NOT call generate_image again for the second platform
   - Do NOT use get_brand_image or list_canva_designs as a media source — those are for reference only
   - The composited_url is the ONLY image source for media_urls in save_content`;

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
      description: "Generate a lifestyle image for the post using AI. Describe ONLY mainstream lifestyle scenes — people, nature, fitness, travel, architecture, abstract moods. NEVER mention cannabis, marijuana, weed, plants, grow operations, paraphernalia, vape pens, devices, hardware, packaging, or any text/brand names on objects. Think beverage or outdoor lifestyle brand — zero cannabis context. The brand logo is composited automatically — do not include it in the prompt.",
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
      name: "composite_logo_on_image",
      description: "Overlay the brand logo onto the AI-generated image. Always call this after generate_image and list_approved_logos. Returns a single composited image URL to use in save_content media_urls.",
      input_schema: {
        type: "object" as const,
        properties: {
          image_url: { type: "string", description: "URL of the AI-generated image from generate_image" },
          logo_url: { type: "string", description: "thumbnail_url of the chosen logo from list_approved_logos" },
          filename: { type: "string", description: "Short slug, e.g. 'motivator-lifestyle'" },
        },
        required: ["image_url", "logo_url"],
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
      description: "Save a generated post to the approval queue. media_urls MUST contain the composited image URL from composite_logo_on_image — not separate image and logo URLs.",
      input_schema: {
        type: "object" as const,
        properties: {
          platform: { type: "string", enum: ["instagram", "facebook"] },
          caption: { type: "string", description: "Full caption. MUST end with: For use only by adults 21 years of age or older." },
          hashtags: { type: "array", items: { type: "string" }, description: "Hashtags WITHOUT #. Do NOT use: weed, marijuana, 420, stoner, high, blazed." },
          media_urls: { type: "array", items: { type: "string" }, description: "REQUIRED. Single-element array containing the composited image URL from composite_logo_on_image." },
          scheduled_for: { type: "string", description: "ISO 8601 datetime or omit for manual approval" },
        },
        required: ["platform", "caption", "hashtags", "media_urls"],
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
      case "composite_logo_on_image": {
        const { image_url, logo_url, filename } = input as { image_url: string; logo_url: string; filename?: string };
        const result = await this.apiPost<{ url: string }>("/images/composite", { image_url, logo_url, filename: filename ?? "post" });
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

        const mediaUrls = (input.media_urls as string[] | undefined) ?? [];
        if (mediaUrls.length === 0) throw new Error("media_urls is required — call composite_logo_on_image first and pass the composited URL");

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
