import { Router } from "express";
import { botsRouter } from "./bots.js";
import { postsRouter } from "./posts.js";
import { logsRouter } from "./logs.js";
import { platformsRouter } from "./platforms.js";
import { openclawRouter } from "./openclaw.js";
import { canvaRouter } from "./canva.js";
import { imagesRouter } from "./images.js";

export const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

router.use("/bots", botsRouter);
router.use("/posts", postsRouter);
router.use("/logs", logsRouter);
router.use("/platforms", platformsRouter);
router.use("/openclaw", openclawRouter);
router.use("/canva", canvaRouter);
router.use("/images", imagesRouter);
