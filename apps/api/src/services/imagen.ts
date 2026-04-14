import fs from "fs";
import path from "path";
import { config } from "../config.js";

// Nano Banana (gemini-2.5-flash-image) — free tier, generateContent API
const NANO_BANANA_API = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";
const STATIC_DIR = path.resolve(process.cwd(), "static");

const IMAGE_SAFETY_PREAMBLE = `STRICT RULES — every single one is a hard requirement. Any violation means the image must not be generated:
1. NO cannabis plants, marijuana leaves, hemp plants, or any plant associated with cannabis — not even stylized or abstract.
2. NO cannabis paraphernalia of any kind: no bongs, pipes, joints, blunts, rolling papers, grinders, bubblers, dab rigs.
3. NO vaping or smoking devices: no vape pens, cartridges, batteries, pods, e-cigarettes, or any handheld hardware.
4. NO product packaging, product shapes, or product equipment of any kind — not even implied.
5. NO reference to drugs, cannabis, marijuana, weed, hemp, or any controlled substance — visual or symbolic.
6. NO text, words, brand names, or logos on any object, surface, clothing, or background in the scene.
7. NO third-party or competitor brand imagery of any kind.
8. NO minors, cartoon characters, or imagery appealing to persons under 21.
9. NO depiction of smoking, vaping, inhaling, or any consumption act.
10. NO imagery that could be interpreted as drug culture, counterculture, or substance use of any kind.
11. ONLY generate pure lifestyle imagery: people enjoying nature, fitness, social moments, architecture, travel, abstract art — nothing that references cannabis, drugs, or the cannabis industry in any way.

Think of this as generating an image for a mainstream beverage, fitness, or outdoor lifestyle brand — zero cannabis context.

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
