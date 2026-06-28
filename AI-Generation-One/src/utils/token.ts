// src/utils/token.ts
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/index.js';
import type { AuthPayload } from '../types/auth.types.js';

// Access Token জেনারেট করো (স্বল্পমেয়াদী - ১ দিন)
export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, config.JWT_SECRET, { expiresIn: '1d' });
};

// Refresh Token জেনারেট করো (দীর্ঘমেয়াদী - ৭ দিন)
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

// Refresh Token হ্যাশ করো (ডাটাবেসে স্টোর করার আগে)
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Access Token ভেরিফাই করো
export const verifyAccessToken = (token: string): AuthPayload | null => {
  try {
    return jwt.verify(token, config.JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
};