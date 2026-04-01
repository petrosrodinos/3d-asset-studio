import { Router } from "express";
import { getAiml } from "../services";

const router = Router();

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
