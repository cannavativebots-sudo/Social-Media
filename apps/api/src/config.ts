function require_env(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const config = {
  port: parseInt(process.env.API_PORT ?? "3001", 10),
  databaseUrl: require_env("DATABASE_URL"),
  redisUrl: require_env("REDIS_URL"),
  anthropicApiKey: require_env("ANTHROPIC_API_KEY"),
  apiSecretKey: require_env("API_SECRET_KEY"),
  dashboardOrigin: process.env.DASHBOARD_ORIGIN ?? "http://localhost:3000",

  meta: {
    appId: process.env.META_APP_ID ?? "",
    appSecret: process.env.META_APP_SECRET ?? "",
    accessToken: process.env.META_ACCESS_TOKEN ?? "",
    pageId: process.env.META_PAGE_ID ?? "",
    igAccountId: process.env.META_IG_ACCOUNT_ID ?? "",
  },

  openclaw: {
    apiKey: process.env.OPENCLAW_API_KEY ?? "",
    webhookSecret: process.env.OPENCLAW_WEBHOOK_SECRET ?? "",
  },
};
