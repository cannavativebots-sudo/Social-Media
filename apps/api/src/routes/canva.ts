import { Router } from "express";
import {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  listDesigns,
  listLogoDesigns,
  getDesignThumbnailUrl,
  isAuthorized,
} from "../services/canva.js";

export const canvaRouter = Router();

/** GET /canva/auth — redirect browser to Canva OAuth consent screen */
canvaRouter.get("/auth", (_req, res) => {
  res.redirect(getAuthorizationUrl());
});

/** GET /canva/callback — Canva redirects here after user approves */
canvaRouter.get("/callback", async (req, res, next) => {
  try {
    const { code, error } = req.query as { code?: string; error?: string };
    if (error) {
      res.status(400).send(`Canva OAuth error: ${error}`);
      return;
    }
    if (!code) {
      res.status(400).send("Missing authorization code");
      return;
    }
    await exchangeCodeForTokens(code);
    res.send("<h2>Canva connected successfully. You can close this tab.</h2>");
  } catch (err) {
    next(err);
  }
});

/** GET /canva/status — check if Canva is authorized */
canvaRouter.get("/status", (_req, res) => {
  res.json({ authorized: isAuthorized() });
});

/** GET /canva/designs — list designs with IDs and thumbnail URLs */
canvaRouter.get("/designs", async (_req, res, next) => {
  try {
    const designs = await listDesigns();
    res.json({ designs });
  } catch (err) {
    next(err);
  }
});

/** GET /canva/logos — list only approved logo designs from the designated logos folder */
canvaRouter.get("/logos", async (_req, res, next) => {
  try {
    const logos = await listLogoDesigns();
    res.json({ logos });
  } catch (err) {
    next(err);
  }
});

/** GET /canva/thumbnail/:designId — get thumbnail URL for a specific design */
canvaRouter.get("/thumbnail/:designId", async (req, res, next) => {
  try {
    const url = await getDesignThumbnailUrl(req.params.designId);
    res.json({ url });
  } catch (err) {
    next(err);
  }
});
