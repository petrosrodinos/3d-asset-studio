import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt";

declare global {
  namespace Express {
    interface Request { userId: string; userEmail: string; userRole: string }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.access_token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const p        = verifyAccessToken(token);
    req.userId     = p.sub;
    req.userEmail  = p.email;
    req.userRole   = p.role;
    next();
  } catch {
    res.status(401).json({ error: "Token expired or invalid" });
  }
}
