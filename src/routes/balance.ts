import { Router } from "express";
import { getAiml, getTripo } from "../services";

const router = Router();

router.get("/aiml", async (_req, res) => {
  try {
    res.json(await getAiml().getBalance());
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get("/tripo", async (_req, res) => {
  try {
    res.json(await getTripo().getBalance());
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
