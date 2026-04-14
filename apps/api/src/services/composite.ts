import sharp from "sharp";
import fs from "fs";
import path from "path";

async function uploadToImgbb(imageBuffer: Buffer): Promise<string> {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) throw new Error("IMGBB_API_KEY not set");
  const body = new FormData();
  body.append("key", apiKey);
  body.append("image", imageBuffer.toString("base64"));
  const res = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body });
  const json = await res.json() as { data?: { url?: string }; error?: { message: string } };
  if (!res.ok || !json.data?.url) throw new Error(`imgbb upload failed: ${JSON.stringify(json)}`);
  return json.data.url;
}

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
 * Composite a logo onto the center-bottom of a base image.
 * Logo is prominent (40% of base width), sitting on a clean white semi-transparent
 * backing bar that spans the full width — ensuring it reads clearly on any background.
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

  // Logo occupies 40% of base width, centered
  const logoW = Math.round(baseW * 0.40);

  const resizedLogo = await sharp(logoBuffer)
    .resize(logoW, undefined, { fit: "inside" })
    .png()
    .toBuffer();

  const { width: actualLogoW = logoW, height: logoH = 0 } = await sharp(resizedLogo).metadata();

  // Backing bar: full width, logo height + vertical padding, semi-transparent white
  const barPaddingV = Math.round(baseH * 0.03);
  const barH = logoH + barPaddingV * 2;

  // SVG backing bar — white at 75% opacity
  const backingBar = Buffer.from(
    `<svg width="${baseW}" height="${barH}">
      <rect width="${baseW}" height="${barH}" fill="white" fill-opacity="0.75"/>
    </svg>`
  );

  // Center logo horizontally within the bar
  const logoLeft = Math.round((baseW - actualLogoW) / 2);

  const composited = await base
    .composite([
      // 1. White backing bar at bottom
      {
        input: backingBar,
        top: baseH - barH,
        left: 0,
        blend: "over",
      },
      // 2. Logo centered on the bar
      {
        input: resizedLogo,
        top: baseH - barH + barPaddingV,
        left: logoLeft,
        blend: "over",
      },
    ])
    .png()
    .toBuffer();

  if (!fs.existsSync(STATIC_DIR)) fs.mkdirSync(STATIC_DIR, { recursive: true });

  const fname = `${filename}-${Date.now()}.png`;
  fs.writeFileSync(path.join(STATIC_DIR, fname), composited);

  // Upload to imgbb for a public HTTPS URL (required by Meta API)
  return uploadToImgbb(composited);
}
