import sharp from "sharp";
import fs from "fs";
import path from "path";

const STATIC_DIR = path.resolve(process.cwd(), "static");

async function fetchBuffer(url: string): Promise<Buffer> {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image: ${url} (${res.status})`);
    return Buffer.from(await res.arrayBuffer());
  }
  // Local static file — extract filename from URL
  const fname = url.split("/static/").pop();
  if (!fname) throw new Error(`Cannot resolve local image URL: ${url}`);
  return fs.readFileSync(path.join(STATIC_DIR, fname));
}

/**
 * Composite a logo onto the bottom-right corner of a base image.
 * Returns the public URL of the saved composited image.
 */
export async function compositeLogoOntoImage(
  baseImageUrl: string,
  logoUrl: string,
  filename: string
): Promise<string> {
  const [baseBuffer, logoBuffer] = await Promise.all([
    fetchBuffer(baseImageUrl),
    fetchBuffer(logoUrl),
  ]);

  const base = sharp(baseBuffer);
  const { width: baseW = 1024, height: baseH = 1024 } = await base.metadata();

  // Logo occupies 22% of base width, placed bottom-right with 4% padding
  const logoW = Math.round(baseW * 0.22);
  const padding = Math.round(baseW * 0.04);

  const resizedLogo = await sharp(logoBuffer)
    .resize(logoW, undefined, { fit: "inside" })
    .png()
    .toBuffer();

  const { height: logoH = 0 } = await sharp(resizedLogo).metadata();

  const composited = await base
    .composite([{
      input: resizedLogo,
      top: baseH - logoH - padding,
      left: baseW - logoW - padding,
      blend: "over",
    }])
    .png()
    .toBuffer();

  if (!fs.existsSync(STATIC_DIR)) fs.mkdirSync(STATIC_DIR, { recursive: true });

  const fname = `${filename}-${Date.now()}.png`;
  fs.writeFileSync(path.join(STATIC_DIR, fname), composited);

  const host = process.env.PUBLIC_API_URL ?? `http://localhost:${process.env.API_PORT ?? 3001}`;
  return `${host}/static/${fname}`;
}
