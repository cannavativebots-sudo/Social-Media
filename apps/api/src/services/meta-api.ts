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

export async function publishFacebookPost(caption: string, hashtags: string[], imageUrl?: string) {
  const { pageId, accessToken } = config.meta;
  const message = hashtags.length
    ? `${caption}\n\n${hashtags.map((h) => `#${h}`).join(" ")}`
    : caption;

  if (imageUrl) {
    // Photo post — publishes image + caption together
    const data = await graph(`/${pageId}/photos`, "POST", {
      url: imageUrl,
      caption: message,
      access_token: accessToken,
    });
    return data.id as string;
  }

  const data = await graph(`/${pageId}/feed`, "POST", {
    message,
    access_token: accessToken,
  });
  return data.id as string;
}

export async function publishInstagramPost(caption: string, hashtags: string[], imageUrl?: string) {
  const { igAccountId, accessToken } = config.meta;
  const fullCaption = hashtags.length
    ? `${caption}\n\n${hashtags.map((h) => `#${h}`).join(" ")}`
    : caption;

  // Step 1: create media container
  const containerBody: Record<string, unknown> = {
    caption: fullCaption,
    access_token: accessToken,
  };
  if (imageUrl) {
    containerBody.image_url = imageUrl;
    containerBody.media_type = "IMAGE";
  } else {
    // Text-only posts require a published reel or carousel — use IMAGE with placeholder not supported.
    // For now throw a clear error so the bot knows to always supply an image.
    throw new Error("Instagram requires an image URL. Supply a media_urls entry.");
  }

  const container = await graph(`/${igAccountId}/media`, "POST", containerBody);
  const containerId = container.id as string;

  // Step 2: poll until container is FINISHED processing (Instagram needs time to fetch/transcode)
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise((r) => setTimeout(r, 3000));
    const status = await graph(`/${containerId}?fields=status_code&access_token=${accessToken}`, "GET");
    const code = (status as any).status_code as string;
    if (code === "FINISHED") break;
    if (code === "ERROR" || code === "EXPIRED") throw new Error(`Instagram container ${code}: ${JSON.stringify(status)}`);
    // IN_PROGRESS — keep waiting
  }

  // Step 3: publish the container
  const result = await graph(`/${igAccountId}/media_publish`, "POST", {
    creation_id: containerId,
    access_token: accessToken,
  });
  return result.id as string;
}
