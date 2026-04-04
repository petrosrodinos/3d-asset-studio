import type { Request, Response, NextFunction } from "express";
import { debitForOperation, InsufficientTokensError } from "../modules/tokens/tokens.service";
import { TokenOperation } from "../config/models/token-operations";

export function requireTokens(operation: TokenOperation) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await debitForOperation(req.userId, operation);
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
