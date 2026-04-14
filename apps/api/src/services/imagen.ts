import fs from "fs";
import path from "path";
import { config } from "../config.js";

// Nano Banana (gemini-2.5-flash-image) — free tier, generateContent API
const NANO_BANANA_API = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";
const STATIC_DIR = path.resolve(process.cwd(), "static");

/** Generate an image with Nano Banana (Gemini 2.5 Flash Image) and save to /static */
export async function generateImage(prompt: string, filename: string): Promise<string> {
  const res = await fetch(`${NANO_BANANA_API}?key=${config.gemini.apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
    }),
  });

  const json = await res.json() as Record<string, unknown>;
  if (!res.ok) throw new Error(`Nano Banana API error: ${JSON.stringify(json)}`);

  const parts = (json as any)?.candidates?.[0]?.content?.parts as Array<{
    inlineData?: { mimeType: string; data: string };
  }> | undefined;

  const imagePart = parts?.find((p) => p.inlineData?.data);
  if (!imagePart?.inlineData) throw new Error("Nano Banana returned no image data");

  const ext = imagePart.inlineData.mimeType === "image/jpeg" ? "jpg" : "png";
  if (!fs.existsSync(STATIC_DIR)) fs.mkdirSync(STATIC_DIR, { recursive: true });

  const fname = `${filename}-${Date.now()}.${ext}`;
  fs.writeFileSync(path.join(STATIC_DIR, fname), Buffer.from(imagePart.inlineData.data, "base64"));

  const host = process.env.PUBLIC_API_URL ?? `http://localhost:${process.env.API_PORT ?? 3001}`;
  return `${host}/static/${fname}`;
}
