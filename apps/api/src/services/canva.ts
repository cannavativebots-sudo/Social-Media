import { config } from "../config.js";

const CANVA_API = "https://api.canva.com/rest/v1";

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }

  const credentials = Buffer.from(
    `${config.canva.clientId}:${config.canva.clientSecret}`
  ).toString("base64");

  const res = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=design%3Acontent%3Aread%20design%3Acontent%3Awrite%20design%3Ameta%3Aread%20asset%3Aread%20asset%3Awrite%20export%3Awrite",
  });

  const json = await res.json() as Record<string, unknown>;
  if (!res.ok) throw new Error(`Canva auth failed: ${JSON.stringify(json)}`);

  const token = json.access_token as string;
  const expiresIn = (json.expires_in as number) ?? 3600;
  cachedToken = { value: token, expiresAt: Date.now() + expiresIn * 1000 };
  return token;
}

async function canvaReq(path: string, method = "GET", body?: unknown) {
  const token = await getAccessToken();
  const res = await fetch(`${CANVA_API}${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json() as Record<string, unknown>;
  if (!res.ok) throw new Error(`Canva API error: ${JSON.stringify(json)}`);
  return json;
}

/** List available design templates/designs in the account */
export async function listDesigns(limit = 20) {
  return canvaReq(`/designs?limit=${limit}`);
}

/** Create a new design from a template */
export async function createDesignFromTemplate(templateId: string, title: string) {
  return canvaReq("/designs", "POST", {
    design_type: { type: "preset", name: "InstagramPost" },
    asset_id: templateId,
    title,
  });
}

/** Export a design as a PNG and return the download URL */
export async function exportDesign(designId: string): Promise<string> {
  // Kick off export job
  const job = await canvaReq("/exports", "POST", {
    design_id: designId,
    format: { type: "png", lossless: false },
  }) as { job: { id: string } };

  const jobId = job.job?.id;
  if (!jobId) throw new Error("Canva export job ID missing");

  // Poll until complete (max 30s)
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const status = await canvaReq(`/exports/${jobId}`) as {
      job: { status: string; urls?: string[] };
    };
    if (status.job?.status === "success" && status.job.urls?.[0]) {
      return status.job.urls[0];
    }
    if (status.job?.status === "failed") {
      throw new Error("Canva export job failed");
    }
  }
  throw new Error("Canva export timed out");
}

/** Verify credentials work — call on startup or from a health check */
export async function verifyCanvaAuth(): Promise<boolean> {
  try {
    await getAccessToken();
    return true;
  } catch {
    return false;
  }
}
