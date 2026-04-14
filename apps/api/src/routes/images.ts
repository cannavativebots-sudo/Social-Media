import { Router } from "express";
import { generateImage } from "../services/imagen.js";
import { compositeLogoOntoImage } from "../services/composite.js";

export const imagesRouter = Router();

/** POST /images/generate — generate an image via Gemini */
imagesRouter.post("/generate", async (req, res, next) => {
  try {
    const { prompt, filename } = req.body as { prompt?: string; filename?: string };
    if (!prompt) {
      res.status(400).json({ error: "prompt is required" });
      return;
    }
    const url = await generateImage(prompt, filename ?? "post");
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

/** POST /images/composite — overlay a logo onto a base image, return single composited URL */
imagesRouter.post("/composite", async (req, res, next) => {
  try {
    const { image_url, logo_url, filename } = req.body as {
      image_url?: string;
      logo_url?: string;
      filename?: string;
    };
    if (!image_url || !logo_url) {
      res.status(400).json({ error: "image_url and logo_url are required" });
      return;
    }
    const url = await compositeLogoOntoImage(image_url, logo_url, filename ?? "post");
    res.json({ url });
  } catch (err) {
    next(err);
  }
});
