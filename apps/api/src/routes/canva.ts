import { Router } from "express";
import {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  listDesigns,
  findDesignByTitle,
  exportDesign,
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

/** GET /canva/designs — list designs from the Canva account */
canvaRouter.get("/designs", async (_req, res, next) => {
  try {
    const designs = await listDesigns();
    res.json({ designs });
  } catch (err) {
    next(err);
  }
});

/** POST /canva/export — export a design by ID or title keyword */
canvaRouter.post("/export", async (req, res, next) => {
  try {
    const { design_id, title_keyword } = req.body as { design_id?: string; title_keyword?: string };

    let id = design_id;

    if (!id && title_keyword) {
      const match = await findDesignByTitle(title_keyword);
      if (!match) {
        res.status(404).json({ error: `No design found matching: ${title_keyword}` });
        return;
      }
      id = match.id;
    }

    if (!id) {
      res.status(400).json({ error: "Provide design_id or title_keyword" });
      return;
    }

    const url = await exportDesign(id);
    res.json({ url });
  } catch (err) {
    next(err);
  }
});
