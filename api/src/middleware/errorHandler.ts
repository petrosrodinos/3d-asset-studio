import type { Request, Response, NextFunction } from "express";
import { InsufficientTokensError } from "../modules/tokens/tokens.service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const message = err instanceof Error ? err.message : String(err);
  console.error("[errorHandler]", message);
  const status: number = typeof err.status === "number" ? err.status
    : typeof err.statusCode === "number" ? err.statusCode
    : 500;

  if (err instanceof InsufficientTokensError) {
    res.status(402).json({ error: message, required: err.required, balance: err.balance });
    return;
  }

  const body: Record<string, unknown> = { error: message };
  if (status === 402 && typeof err.required === "number") {
    body.required = err.required;
    body.balance = err.balance;
  }

  res.status(status).json(body);
}
