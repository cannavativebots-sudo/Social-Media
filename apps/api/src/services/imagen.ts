import fs from "fs";
import path from "path";
import { config } from "../config.js";

// Nano Banana (gemini-2.5-flash-image) — free tier, generateContent API
const NANO_BANANA_API = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";
const STATIC_DIR = path.resolve(process.cwd(), "static");

const IMAGE_SAFETY_PREAMBLE = `STRICT RULES — violating any of these is a generation failure:
1. NO cannabis paraphernalia of any kind: no bongs, pipes, joints, blunts, rolling papers, grinders, bubblers, dab rigs.
2. NO vaping or smoking devices: no vape pens, cartridges, batteries, pods, e-cigarettes, or any handheld hardware.
3. NO product packaging, product shapes, or product equipment of any kind — not even implied.
4. NO text, words, brand names, or logos on any object, surface, clothing, or background in the scene.
5. NO third-party or competitor brand imagery of any kind.
6. NO minors, cartoon characters, or imagery appealing to persons under 21.
7. NO depiction of smoking, vaping, or consumption acts.
8. ONLY generate pure lifestyle imagery: people, nature, environments, moods, abstract art, architecture — no products.

With those constraints, generate the following lifestyle image:
`;

/** Generate an image with Nano Banana (Gemini 2.5 Flash Image) and save to /static */
export async function generateImage(prompt: string, filename: string): Promise<string> {
  const guardedPrompt = IMAGE_SAFETY_PREAMBLE + prompt;
  const res = await fetch(`${NANO_BANANA_API}?key=${config.gemini.apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: guardedPrompt }] }],
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
