import fs from "fs";
import path from "path";
import { config } from "../config.js";

const IMAGEN_API = "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict";
const STATIC_DIR = path.resolve(process.cwd(), "static");

/** Generate an image with Imagen 3 and save it to /static, return public URL */
export async function generateImage(prompt: string, filename: string): Promise<string> {
  const res = await fetch(`${IMAGEN_API}?key=${config.gemini.apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: "1:1",
        safetyFilterLevel: "block_some",
        personGeneration: "allow_adult",
      },
    }),
  });

  const json = await res.json() as Record<string, unknown>;
  if (!res.ok) throw new Error(`Imagen API error: ${JSON.stringify(json)}`);

  const predictions = json.predictions as Array<{ bytesBase64Encoded?: string }>;
  const b64 = predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error("Imagen returned no image data");

  // Save to static dir so it's served by the API
  if (!fs.existsSync(STATIC_DIR)) fs.mkdirSync(STATIC_DIR, { recursive: true });
  const fname = `${filename}-${Date.now()}.png`;
  fs.writeFileSync(path.join(STATIC_DIR, fname), Buffer.from(b64, "base64"));

  const host = process.env.PUBLIC_API_URL ?? `http://localhost:${process.env.API_PORT ?? 3001}`;
  return `${host}/static/${fname}`;
}
