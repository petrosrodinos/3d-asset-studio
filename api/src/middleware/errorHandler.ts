import type { Request, Response, NextFunction } from "express";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const message = err instanceof Error ? err.message : String(err);
  console.error("[errorHandler]", message);
  const status: number = typeof err.status === "number" ? err.status
    : typeof err.statusCode === "number" ? err.statusCode
    : 500;
  res.status(status).json({ error: message });
}
