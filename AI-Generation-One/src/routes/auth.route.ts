// src/routes/auth.route.ts
import { Router } from "express";
import {
  googleLogin,
  googleCallback,
  githubLogin,      // ইম্পোর্ট করো
  githubCallback,   // ইম্পোর্ট করো
  logout,
  refreshToken,
  getMe,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Google routes
router.get("/auth/google/login", googleLogin);
router.get("/auth/google/callback", googleCallback);

// GitHub routes (স্ল্যাশ দিয়ে)
router.get("/auth/github/login", githubLogin);
router.get("/auth/github/callback", githubCallback);  

// Common routes
router.post("/auth/refresh", refreshToken);
router.post("/auth/logout", logout);

// Protected routes
router.get("/auth/me", authenticate, getMe);

export const authRouter = router;