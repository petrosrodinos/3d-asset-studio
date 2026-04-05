import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import * as variantsSvc from "./skin-variants.service";

const router = Router({ mergeParams: true });

router.post("/", async (req: Request<{ skinId: string }>, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await variantsSvc.createVariant(req.params.skinId, req.body));
  } catch (err) { next(err); }
});

router.delete("/by-id/:id", async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    res.json(await variantsSvc.deleteVariantById(req.params.id));
  } catch (err) { next(err); }
});

router.put("/by-id/:id", async (req: Request<{ skinId: string; id: string }>, res: Response, next: NextFunction) => {
  try {
    const updated = await variantsSvc.updateVariantById(req.params.skinId, req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Variant not found" });
    res.json(updated);
  } catch (err) { next(err); }
});

router.get("/:variant", async (req: Request<{ skinId: string; variant: string }>, res: Response, next: NextFunction) => {
  try {
    const v = await variantsSvc.getVariant(req.params.skinId, req.params.variant);
    if (!v) return res.status(404).json({ error: "Variant not found" });
    res.json(v);
  } catch (err) { next(err); }
});

router.post("/:variant/generate-image", async (req: Request<{ figureId: string; skinId: string; variant: string }>, res: Response, next: NextFunction) => {
  try {
    const { figureId, skinId, variant } = req.params;
    const result = await variantsSvc.generateImageForVariant(req.userId, skinId, variant, figureId, req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
});

export default router;
