import { Router } from "express";
import * as auth from "./auth.service";
import { requireAuth } from "../../middleware/requireAuth";
import { findUserById } from "../users/users.service";
import { cookieOptions, ACCESS_TTL, REFRESH_TTL } from "../../lib/jwt";

const router = Router();

const setCookies = (res: import("express").Response, a: string, r: string) => {
  res.cookie("access_token",  a, cookieOptions(ACCESS_TTL));
  res.cookie("refresh_token", r, cookieOptions(REFRESH_TTL));
};

router.post("/register", async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });
    const result = await auth.register(email, password, displayName);
    setCookies(res, result.accessToken, result.refreshToken);
    res.status(201).json({ user: result.user });
  } catch (e) { next(e); }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });
    const result = await auth.login(email, password);
    setCookies(res, result.accessToken, result.refreshToken);
    res.json({ user: result.user });
  } catch (e) { next(e); }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) return res.status(401).json({ error: "No refresh token" });
    const result = await auth.refresh(token);
    setCookies(res, result.accessToken, result.refreshToken);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post("/logout", async (req, res, next) => {
  try {
    if (req.cookies?.refresh_token) await auth.logout(req.cookies.refresh_token);
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await findUserById(req.userId);
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json({ id: user.id, email: user.email, displayName: user.displayName, role: user.role, tokenBalance: user.tokenBalance });
  } catch (e) { next(e); }
});

export default router;
