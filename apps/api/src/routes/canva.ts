import { Router } from "express";
import { listDesigns, findDesignByTitle, exportDesign } from "../services/canva.js";

export const canvaRouter = Router();

/** GET /canva/designs — list designs from the Canva account */
canvaRouter.get("/designs", async (_req, res, next) => {
  try {
    const designs = await listDesigns(50);
    res.json({ designs });
  } catch (err) {
    next(err);
  }
});

/** POST /canva/export — export a design by ID or find by title keyword and export */
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
