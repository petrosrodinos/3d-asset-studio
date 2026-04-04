import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import {
  getTaskController,
  meshFromImageUrlController,
  prerigCheckController,
  proxyModelController,
  startRetargetController,
  startRigController,
} from "./tripo.controller";

const router = Router();

router.post("/proxy-model", proxyModelController);
router.get("/task/:id", getTaskController);
router.post("/mesh-from-image-url", requireAuth, meshFromImageUrlController);
router.post("/prerig-check", requireAuth, prerigCheckController);
router.post("/start-rig", requireAuth, startRigController);
router.post("/start-retarget", requireAuth, startRetargetController);

export default router;

