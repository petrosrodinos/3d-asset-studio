import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import * as billing from "./billing.service";
import { checkoutBodySchema, usageQuerySchema } from "./billing.schemas";

const router = Router();

router.get("/packs", (_req, res, next) => {
  try {
    res.json(billing.getTokenPacks());
  } catch (e) {
    next(e);
  }
});

router.post("/checkout", requireAuth, (req, res, next) => {
  const parsed = checkoutBodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
  billing
    .createCheckoutSession(req.userId, parsed.data.packId)
    .then((out) => res.json(out))
    .catch(next);
});

router.get("/balance", requireAuth, (req, res, next) => {
  billing
    .getBalance(req.userId)
    .then((out) => res.json(out))
    .catch(next);
});

router.get("/history", requireAuth, (req, res, next) => {
  billing
    .getPurchaseHistory(req.userId)
    .then((out) => res.json(out))
    .catch(next);
});

router.get("/usage", requireAuth, (req, res, next) => {
  const parsed = usageQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
  billing
    .getUsageHistory(req.userId, parsed.data.limit, parsed.data.offset)
    .then((out) => res.json(out))
    .catch(next);
});

export default router;
