import type { BotRecord, BotRole, PostRecord, PostStatus, LogEntry, PlatformConnection } from "digital-office-shared";

const BASE = "/api/v1";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${init?.method ?? "GET"} ${path} → ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// Bots
export const getBots = () => req<BotRecord[]>("/bots");

export const triggerBot = (role: BotRole, payload: Record<string, unknown> = {}) =>
  req<{ ok: boolean; message: string }>(`/bots/${role}/trigger`, {
    method: "POST",
    body: JSON.stringify({ payload }),
  });

// Posts
export const getPosts = (status?: PostStatus) =>
  req<PostRecord[]>(`/posts${status ? `?status=${status}` : ""}`);

export const createPost = (data: {
  platform: "facebook" | "instagram";
  caption: string;
  hashtags: string[];
  media_urls: string[];
}) => req<PostRecord>("/posts", { method: "POST", body: JSON.stringify({ ...data, created_by_bot: null }) });

export const approvePost = (id: string) =>
  req<PostRecord>(`/posts/${id}/approve`, { method: "POST" });

export const rejectPost = (id: string) =>
  req<PostRecord>(`/posts/${id}/reject`, { method: "POST" });

export const markPostPublished = (id: string) =>
  req<PostRecord>(`/posts/${id}/mark_published`, { method: "POST" });

// Logs
export const getLogs = (limit = 100) =>
  req<LogEntry[]>(`/logs?limit=${limit}`);

// Platforms
export const getPlatforms = () =>
  req<PlatformConnection[]>("/platforms");

// Strategy reports
export interface StrategyReport {
  id: string;
  created_by_bot: string | null;
  summary: string | null;
  report: Record<string, unknown>;
  created_at: string;
}

export const getStrategyReports = () =>
  req<StrategyReport[]>("/strategy-reports");

export const getLatestStrategyReport = () =>
  req<StrategyReport>("/strategy-reports/latest");
