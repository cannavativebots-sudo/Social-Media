import fs from "fs";
import path from "path";
import { config } from "../config.js";

// Gemini 2.0 Flash image generation (free tier via Gemini Developer API)
const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent";
const STATIC_DIR = path.resolve(process.cwd(), "static");

/** Generate an image with Gemini 2.0 Flash and save to /static, returns public URL */
export async function generateImage(prompt: string, filename: string): Promise<string> {
  const res = await fetch(`${GEMINI_API}?key=${config.gemini.apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
    }),
  });

  const json = await res.json() as Record<string, unknown>;
  if (!res.ok) throw new Error(`Gemini image API error: ${JSON.stringify(json)}`);

  // Find the inline image data in the response
  const parts = (json as any)?.candidates?.[0]?.content?.parts as Array<{
    text?: string;
    inlineData?: { mimeType: string; data: string };
  }> | undefined;

  const imagePart = parts?.find((p) => p.inlineData?.data);
  if (!imagePart?.inlineData) throw new Error("Gemini returned no image data");

  const ext = imagePart.inlineData.mimeType === "image/jpeg" ? "jpg" : "png";
  if (!fs.existsSync(STATIC_DIR)) fs.mkdirSync(STATIC_DIR, { recursive: true });

  const fname = `${filename}-${Date.now()}.${ext}`;
  fs.writeFileSync(path.join(STATIC_DIR, fname), Buffer.from(imagePart.inlineData.data, "base64"));

  const host = process.env.PUBLIC_API_URL ?? `http://localhost:${process.env.API_PORT ?? 3001}`;
  return `${host}/static/${fname}`;
}
