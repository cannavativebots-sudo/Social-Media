import type { BotRole, BotContext } from "digital-office-shared";

// Import all bots eagerly — they're small classes, startup cost is negligible
import { DirectorBot }            from "digital-office-bots/director";
import { SocialMediaManagerBot }  from "digital-office-bots/social-media-manager";
import { InstagramBot }           from "digital-office-bots/instagram";
import { FacebookBot }            from "digital-office-bots/facebook";
import { XBot }                   from "digital-office-bots/x";
import { ContentCreatorBot }      from "digital-office-bots/content-creator";
import { SchedulerBot }           from "digital-office-bots/scheduler";
import { WebsiteManagerBot }      from "digital-office-bots/website-manager";

const BOT_NAMES: Record<BotRole, string> = {
  director:             "Director",
  social_media_manager: "Social Media Manager",
  instagram:            "Instagram Bot",
  facebook:             "Facebook Bot",
  x:                    "X Bot",
  content_creator:      "Content Creator",
  scheduler:            "Scheduler",
  website_manager:      "Website Manager",
};

function createBot(role: BotRole) {
  const name = BOT_NAMES[role];
  switch (role) {
    case "director":             return new DirectorBot(role, name);
    case "social_media_manager": return new SocialMediaManagerBot(role, name);
    case "instagram":            return new InstagramBot(role, name);
    case "facebook":             return new FacebookBot(role, name);
    case "x":                    return new XBot(role, name);
    case "content_creator":      return new ContentCreatorBot(role, name);
    case "scheduler":            return new SchedulerBot(role, name);
    case "website_manager":      return new WebsiteManagerBot(role, name);
    default:
      throw new Error(`Unknown bot role: ${role}`);
  }
}

export const BotRunner = {
  trigger(role: BotRole, payload: { task?: string } & Record<string, unknown> = {}): void {
    const bot = createBot(role);
    const context: BotContext = {
      task: payload.task ?? `Execute your default responsibilities for role: ${role}`,
      payload,
    };
    bot.run(context).catch((err: unknown) => {
      console.error(JSON.stringify({
        level: "error",
        message: `BotRunner: ${role} threw uncaught error`,
        error: err instanceof Error ? err.message : String(err),
      }));
    });
  },
};
