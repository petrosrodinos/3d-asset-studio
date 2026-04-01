import { Router } from "express";
import { getAiml } from "../services";

const router = Router();

router.get("/models", async (_req, res) => {
  try {
    const { data } = await getAiml().listModels();
    const imageModels = data
      .filter((m) => m.endpoints?.includes("/v1/images/generations"))
      .map((m) => ({ id: m.id, label: m.id }))
      .sort((a, b) => a.id.localeCompare(b.id));
    res.json(imageModels);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post("/generate", async (req, res) => {
  const { prompt, model = "flux/schnell", size, n, steps } = req.body as Record<string, unknown>;

  try {
    const result = await getAiml().generateImage({
      model: model as string,
      prompt: prompt as string,
      size: size as string | undefined,
      n: n as number | undefined,
      steps: steps as number | undefined,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
