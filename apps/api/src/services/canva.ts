import fs from "fs";
import path from "path";
import crypto from "crypto";
import { config } from "../config.js";

const CANVA_API = "https://api.canva.com/rest/v1";
const CANVA_AUTH_URL = "https://www.canva.com/api/oauth/authorize";
const CANVA_TOKEN_URL = "https://api.canva.com/rest/v1/oauth/token";
const SCOPES = "design:content:read design:content:write design:meta:read asset:read asset:write";

// Persistent volume in Docker: /app/data — falls back to /tmp in dev
const DATA_DIR = fs.existsSync("/app/data") ? "/app/data" : "/tmp";
const TOKEN_FILE = path.join(DATA_DIR, "canva_token.json");
const PKCE_FILE = path.join(DATA_DIR, "canva_pkce.json");

// ── PKCE helpers ──────────────────────────────────────────────────────────────

function generateCodeVerifier(): string {
  return crypto.randomBytes(64).toString("base64url").slice(0, 128);
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

function saveCodeVerifier(verifier: string): void {
  fs.writeFileSync(PKCE_FILE, JSON.stringify({ verifier }), "utf8");
}

function loadAndDeleteCodeVerifier(): string | null {
  try {
    const { verifier } = JSON.parse(fs.readFileSync(PKCE_FILE, "utf8")) as { verifier: string };
    fs.unlinkSync(PKCE_FILE);
    return verifier;
  } catch {
    return null;
  }
}

interface TokenStore {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

function loadTokenStore(): TokenStore | null {
  try {
    return JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8")) as TokenStore;
  } catch {
    return null;
  }
}

function saveTokenStore(store: TokenStore): void {
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(store, null, 2), "utf8");
}

async function refreshAccessToken(refreshToken: string): Promise<TokenStore> {
  const credentials = Buffer.from(
    `${config.canva.clientId}:${config.canva.clientSecret}`
  ).toString("base64");

  const res = await fetch(CANVA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
  });

  const json = await res.json() as Record<string, unknown>;
  if (!res.ok) throw new Error(`Canva token refresh failed: ${JSON.stringify(json)}`);

  const store: TokenStore = {
    access_token: json.access_token as string,
    refresh_token: (json.refresh_token as string | undefined) ?? refreshToken,
    expires_at: Date.now() + ((json.expires_in as number) ?? 3600) * 1000,
  };
  saveTokenStore(store);
  return store;
}

async function getAccessToken(): Promise<string> {
  const store = loadTokenStore();

  if (!store) {
    throw new Error("Canva not authorized — visit /api/v1/canva/auth to connect");
  }

  // Refresh if within 60s of expiry
  if (Date.now() >= store.expires_at - 60_000) {
    const refreshed = await refreshAccessToken(store.refresh_token);
    return refreshed.access_token;
  }

  return store.access_token;
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

/** Build the Canva OAuth authorization URL with PKCE — redirect the user here */
export function getAuthorizationUrl(): string {
  const verifier = generateCodeVerifier();
  saveCodeVerifier(verifier);
  const challenge = generateCodeChallenge(verifier);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.canva.clientId,
    redirect_uri: config.canva.redirectUri,
    scope: SCOPES,
    state: "digital-office",
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return `${CANVA_AUTH_URL}?${params.toString()}`;
}

/** Exchange authorization code for tokens and persist them */
export async function exchangeCodeForTokens(code: string): Promise<void> {
  const verifier = loadAndDeleteCodeVerifier();
  if (!verifier) throw new Error("PKCE code verifier missing — restart the auth flow");

  const credentials = Buffer.from(
    `${config.canva.clientId}:${config.canva.clientSecret}`
  ).toString("base64");

  const res = await fetch(CANVA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.canva.redirectUri,
      code_verifier: verifier,
    }).toString(),
  });

  const json = await res.json() as Record<string, unknown>;
  if (!res.ok) throw new Error(`Canva code exchange failed: ${JSON.stringify(json)}`);

  saveTokenStore({
    access_token: json.access_token as string,
    refresh_token: json.refresh_token as string,
    expires_at: Date.now() + ((json.expires_in as number) ?? 3600) * 1000,
  });
}

interface CanvaDesign {
  id: string;
  title: string;
  thumbnail_url: string | null;
  updated_at: number;
}

/** List designs in the account, optionally filtered to a specific folder */
export async function listDesigns(limit = 50, folderId?: string): Promise<CanvaDesign[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (folderId) params.set("folder_id", folderId);
  const res = await canvaReq(`/designs?${params.toString()}`) as {
    items?: { id: string; title?: string; thumbnail?: { url: string }; updated_at: number }[]
  };
  return (res.items ?? []).map((d) => ({
    id: d.id,
    title: d.title ?? d.id,
    thumbnail_url: d.thumbnail?.url ?? null,
    updated_at: d.updated_at,
  }));
}

/** List only the approved logo designs from the designated Canva logos folder */
export async function listLogoDesigns(): Promise<CanvaDesign[]> {
  const folderId = process.env.CANVA_LOGOS_FOLDER_ID;
  if (!folderId) throw new Error("CANVA_LOGOS_FOLDER_ID is not set — create the logos folder in Canva and add its ID to .env");
  return listDesigns(50, folderId);
}

/** Get the thumbnail URL for a specific design ID */
export async function getDesignThumbnailUrl(designId: string): Promise<string> {
  const res = await canvaReq(`/designs/${designId}`) as {
    design?: { thumbnail?: { url: string } }
  };
  const url = res.design?.thumbnail?.url;
  if (!url) throw new Error(`No thumbnail available for design ${designId}`);
  return url;
}

/** Check if Canva is authorized (token file exists) */
export function isAuthorized(): boolean {
  return loadTokenStore() !== null;
}
