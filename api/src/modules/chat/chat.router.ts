import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import { requireTokens } from "../../middleware/requireTokens";
import { chatController } from "./chat.controller";

const router = Router();

router.post("/", requireAuth, requireTokens("chat"), chatController);

export default router;

