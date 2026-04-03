import { Router } from "express";
import * as models3dSvc from "./models3d.service";

const router = Router({ mergeParams: true });

router.get("/:model3dId", async (req, res, next) => {
  try {
    const m = await models3dSvc.getModel3D(req.params.model3dId);
    if (!m) return res.status(404).json({ error: "Model not found" });
    res.json(m);
  } catch (err) { next(err); }
});

router.delete("/:model3dId", async (req, res, next) => {
  try {
    await models3dSvc.deleteModel3D(req.params.model3dId);
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
