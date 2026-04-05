import type { Request, Response, NextFunction } from "express";
import { debitForOperation, InsufficientTokensError } from "../modules/tokens/tokens.service";
import { TokenOperation } from "../config/models/token-operations";

export function requireTokens(
  operation: TokenOperation,
  idempotencyKeyFromReq?: (req: Request) => string | null | undefined,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idem = idempotencyKeyFromReq?.(req);
      await debitForOperation(req.userId, operation, idem ?? null);
      next();
    } catch (e) {
      if (e instanceof InsufficientTokensError) {
        res.status(402).json({ error: e.message, required: e.required, balance: e.balance });
        return;
      }
      next(e);
    }
  };
}
