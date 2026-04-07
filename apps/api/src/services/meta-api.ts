import { config } from "../config.js";

const API_BASE = "https://graph.facebook.com/v22.0";

async function graph(path: string, method: string, body?: Record<string, unknown>) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json() as Record<string, unknown>;
  if (!res.ok) throw new Error(`Meta API error: ${JSON.stringify(json)}`);
  return json;
}

export async function publishFacebookPost(caption: string, hashtags: string[]) {
  const { pageId, accessToken } = config.meta;
  const message = hashtags.length
    ? `${caption}\n\n${hashtags.map((h) => `#${h}`).join(" ")}`
    : caption;

  const data = await graph(`/${pageId}/feed`, "POST", {
    message,
    access_token: accessToken,
  });
  return data.id as string;
}
