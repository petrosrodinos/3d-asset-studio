import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import {
  generateImageController,
  listImageModelsController,
} from "./images.controller";

const router = Router();

router.get("/models", listImageModelsController);
router.post("/generate", requireAuth, generateImageController);

export default router;

