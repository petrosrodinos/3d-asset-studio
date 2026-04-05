import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import * as animationsSvc from "./animations.service";

const router = Router({ mergeParams: true });

router.get("/", async (req: Request<{ model3dId: string }>, res: Response, next: NextFunction) => {
  try {
    res.json(await animationsSvc.listAnimations(req.params.model3dId));
  } catch (err) { next(err); }
});

router.delete(
  "/:animationId",
  async (req: Request<{ model3dId: string; animationId: string }>, res: Response, next: NextFunction) => {
    try {
      await animationsSvc.deleteAnimationForUser(req.userId, req.params.model3dId, req.params.animationId);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

export default router;
