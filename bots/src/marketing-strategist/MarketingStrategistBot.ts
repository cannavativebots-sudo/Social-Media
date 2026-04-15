import Anthropic from "@anthropic-ai/sdk";
import { BaseBot, type BotContext, type BotResult } from "../base/BaseBot.js";

export class MarketingStrategistBot extends BaseBot {
  protected systemPrompt = `You are the Marketing Strategist for Cannavative, a Nevada cannabis brand.
Your role is to analyze post performance data, study competitor strategies, and produce actionable
recommendations for posting cadence and content strategy on Facebook and Instagram.

When analyzing data:
- Prioritize data-backed insights over generic advice
- Consider Nevada's cannabis market and PST/PDT time zone for all time recommendations
- Respect Meta's cannabis content policies (no sale solicitation, lifestyle/community focus only)
- Account for the fact that cannabis audience engagement skews evening (7–10pm) and weekends

Deliver recommendations structured as:
1. Optimal posting schedule — specific days and hour windows in PST
2. Posting frequency — per platform per week
3. Content themes — which to double down on, which to drop
4. Competitor insights — specific tactics worth adapting (not copying)
5. Hashtag and caption notes

Always call save_strategy as your final step to persist your recommendations.`;

  protected tools: Anthropic.Tool[] = [
    {
      name: "get_post_history",
      description: "Get our published posts to analyze frequency, timing patterns, and content types",
      input_schema: {
        type: "object" as const,
        properties: {
          platform: {
            type: "string",
            enum: ["facebook", "instagram", "all"],
            description: "Filter by platform, or 'all' for both",
          },
          limit: {
            type: "number",
            description: "Max posts to retrieve (default 50)",
          },
        },
        required: [],
      },
    },
    {
      name: "get_page_fans_online",
      description: "Get hourly data showing when our Facebook fans are most active — key input for optimal posting times",
      input_schema: { type: "object" as const, properties: {}, required: [] },
    },
    {
      name: "get_post_engagement_insights",
      description: "Get reach and engagement metrics for recent Facebook posts to identify top-performing content",
      input_schema: {
        type: "object" as const,
        properties: {
          limit: {
            type: "number",
            description: "Number of recent posts to analyze (default 25)",
          },
        },
        required: [],
      },
    },
    {
      name: "research_cannabis_competitors",
      description: "Get competitive intelligence on successful cannabis brands' social media strategies",
      input_schema: {
        type: "object" as const,
        properties: {
          focus: {
            type: "string",
            enum: ["posting_cadence", "content_themes", "engagement_tactics", "all"],
            description: "Which aspect of competitor strategy to focus on",
          },
        },
        required: [],
      },
    },
    {
      name: "get_saved_strategy",
      description: "Retrieve the most recently saved strategy report for comparison",
      input_schema: { type: "object" as const, properties: {}, required: [] },
    },
    {
      name: "save_strategy",
      description: "Persist strategy recommendations so the team and other bots can reference them",
      input_schema: {
        type: "object" as const,
        properties: {
          report: {
            type: "object",
            description: "Structured report: posting_schedule, frequency, content_themes, competitor_insights, hashtag_notes",
          },
          summary: {
            type: "string",
            description: "Plain-language summary of the top 3–5 actionable recommendations",
          },
        },
        required: ["report", "summary"],
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
      case "get_post_history": {
        const platform = input.platform && input.platform !== "all" ? `&platform=${input.platform}` : "";
        const limit = input.limit ? `&limit=${input.limit}` : "&limit=50";
        return this.apiGet(`/posts?status=published${platform}${limit}`);
      }
      case "get_page_fans_online":
        return this.apiGet("/insights/facebook/fans-online");
      case "get_post_engagement_insights": {
        const limit = input.limit ?? 25;
        return this.apiGet(`/insights/facebook/post-engagement?limit=${limit}`);
      }
      case "research_cannabis_competitors":
        return this.getCompetitorIntelligence(input.focus as string | undefined);
      case "get_saved_strategy":
        return this.apiGet("/strategy-reports/latest");
      case "save_strategy":
        return this.apiPost("/strategy-reports", {
          report: input.report,
          summary: input.summary,
          created_by_bot: "marketing_strategist",
        });
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  private getCompetitorIntelligence(focus?: string): unknown {
    const data = {
      posting_cadence: {
        industry_benchmarks: {
          facebook: "3–5x per week, Tue–Thu peak. Best windows: 11am–1pm and 7–9pm PST",
          instagram: "4–7x per week. Reels outperform static posts 2–3x on reach. Stories: daily",
          notes: "Cannabis brands that post on a consistent schedule see 30–40% higher follower retention vs. burst posters",
        },
        top_brand_cadence: [
          { brand: "Cookies SF", platforms: "Daily IG, 4–5x/week FB", peak_time: "7–10pm PST", notes: "Heavy Reels usage, celebrity collab timing tied to drops" },
          { brand: "Stiiizy", platforms: "5–7x/week IG, 3–4x/week FB", peak_time: "12–2pm and 8–10pm PST", notes: "Minimalist product content performs best midday; lifestyle content evenings" },
          { brand: "Raw Garden", platforms: "3–4x/week each platform", peak_time: "6–9pm PST", notes: "Educational content drives saved posts — strong for algorithmic reach" },
          { brand: "Kiva Confections", platforms: "4x/week IG, 2–3x/week FB", peak_time: "11am–1pm PST", notes: "Wellness/lifestyle angle; strong weekend morning engagement" },
          { brand: "Jungle Boys", platforms: "5–6x/week IG", peak_time: "8–11pm PST", notes: "Cultivation aesthetics; very high comment engagement from community" },
        ],
      },
      content_themes: {
        high_performing_themes: [
          { theme: "Behind-the-scenes cultivation and production", engagement_lift: "+45% vs. brand avg", why: "Builds authenticity and trust; rare content type" },
          { theme: "User-generated content / customer reposts", engagement_lift: "+60% vs. brand avg", why: "Social proof; audiences engage more with peers than brands" },
          { theme: "Educational (terpenes, strains, effects, entourage effect)", engagement_lift: "+30% vs. brand avg", why: "Saves and shares drive algorithmic distribution" },
          { theme: "Staff and founder spotlights", engagement_lift: "+35% vs. brand avg", why: "Humanizes brand; strong for loyalty audiences" },
          { theme: "New product teasers (no sale CTAs)", engagement_lift: "+80% vs. brand avg", why: "Anticipation content; must avoid pricing/purchase language per Meta policy" },
          { theme: "Local Nevada community tie-ins", engagement_lift: "+25–40% for regional brands", why: "Geo-relevant content gets prioritized in local feeds" },
        ],
        underperforming_themes: [
          "Product flatlay without context or story",
          "Text-only posts (no visual element)",
          "Overly corporate or salesy language",
          "Recycled content without platform-native adaptation",
        ],
        nevada_specific: "Las Vegas events, Nevada dispensary milestones, and local partnerships consistently outperform national content for NV-based brands",
      },
      engagement_tactics: {
        caption_strategy: [
          "Hook in the first 90 characters — feed truncates after that on both platforms",
          "End captions with a question to drive comments (comment velocity boosts reach in first hour)",
          "Keep CTAs community-focused: 'Tag someone who needs this' rather than 'Shop now'",
          "2–4 purposeful emojis max — more reads as spam to the algorithm",
          "Line breaks improve readability; avoid walls of text",
        ],
        hashtag_strategy: {
          optimal_count: "5–8 hashtags for Instagram (20+ hashtags now penalized by algorithm)",
          mix: "2 brand-owned hashtags + 2 niche community tags + 2–3 broad lifestyle tags",
          avoid: "Mega-tags (weed, marijuana, 420, stoner, dank) — banned on Meta and cause shadow limiting",
          high_performing_tags: [
            "#cannabis", "#cannabiscommunity", "#nevadacannabis", "#cannavative",
            "#craftcannabis", "#cannabisculture", "#vegascannabis", "#nevadamade",
          ],
        },
        algorithm_tips: [
          "Reply to every comment within the first hour — Meta rewards early comment velocity",
          "Reels get 2–3x organic reach vs. static images; prioritize video content",
          "Post natively to each platform — cross-posting without optimization hurts reach",
          "Pin best-performing posts to profile top for new visitor discovery",
          "Carousel posts (multiple images) generate more swipes = more dwell time = better ranking",
        ],
      },
    };

    if (focus === "posting_cadence") return { posting_cadence: data.posting_cadence };
    if (focus === "content_themes") return { content_themes: data.content_themes };
    if (focus === "engagement_tactics") return { engagement_tactics: data.engagement_tactics };
    return data;
  }
}
