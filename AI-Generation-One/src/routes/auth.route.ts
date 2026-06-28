import { Router } from 'express';
import {
  googleLogin,
  googleCallback,
  githubLogin,      // নতুন
  githubCallback,   // নতুন
  logout,
  refreshToken,
  getMe,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Google Routes
router.get('/auth/google/login', googleLogin);
router.get('/auth/google/callback', googleCallback);

// GitHub Routes (নতুন)
router.get('/auth/github/login', githubLogin);
router.get('/auth/github/callback', githubCallback);

// Common Routes
router.post('/auth/refresh', refreshToken);
router.post('/auth/logout', logout);
router.get('/auth/me', authenticate, getMe);

export const authRouter = router;