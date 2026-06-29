import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';

// General API limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for AI endpoints
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 AI requests per hour
  message: {
    success: false,
    message: 'AI generation limit reached. Please try again after 1 hour.',
  },
});

// Auth limiter (prevent brute force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 auth requests per 15 minutes
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
});