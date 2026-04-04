import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import { generateAndMeshController } from "./generate-and-mesh.controller";

const router = Router();

router.post("/generate-and-mesh", requireAuth, generateAndMeshController);

export default router;

