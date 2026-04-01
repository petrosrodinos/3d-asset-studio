import { Router } from "express";
import { readFigures, writeFigures } from "../lib/figures";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    res.json(await readFigures());
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get("/:name", async (req, res) => {
  try {
    const figures = await readFigures();
    const figure = figures.find((f) => f.name === decodeURIComponent(req.params.name));
    if (!figure) return res.status(404).json({ error: "Figure not found" });
    res.json(figure);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post("/", async (req, res) => {
  try {
    const figures = await readFigures();
    const figure = req.body;
    if (!figure?.name) return res.status(400).json({ error: "name is required" });
    if (figures.some((f: any) => f.name === figure.name))
      return res.status(409).json({ error: `Figure "${figure.name}" already exists` });
    figures.push(figure);
    await writeFigures(figures);
    res.status(201).json(figure);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.put("/:name", async (req, res) => {
  try {
    const figures = await readFigures();
    const name = decodeURIComponent(req.params.name);
    const idx = figures.findIndex((f: any) => f.name === name);
    if (idx === -1) return res.status(404).json({ error: "Figure not found" });
    figures[idx] = req.body;
    await writeFigures(figures);
    res.json(figures[idx]);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.delete("/:name", async (req, res) => {
  try {
    const figures = await readFigures();
    const name = decodeURIComponent(req.params.name);
    const idx = figures.findIndex((f: any) => f.name === name);
    if (idx === -1) return res.status(404).json({ error: "Figure not found" });
    const [deleted] = figures.splice(idx, 1);
    await writeFigures(figures);
    res.json(deleted);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
