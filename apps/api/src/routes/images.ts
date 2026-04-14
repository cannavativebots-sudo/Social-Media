import { Router } from "express";
import { generateImage } from "../services/imagen.js";

export const imagesRouter = Router();

/** POST /images/generate — generate an image via Imagen 3 */
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
