// src/utils/cookies.ts
import { Response } from 'express';
import { config } from '../config/index.js';

const COOKIE_PATH = '/api/v1/auth';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // ৭ দিন

// Refresh Token কুকিতে সেট করো
export const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie('refreshToken', token, {
    httpOnly: true,        // JavaScript থেকে access করা যাবে না (XSS থেকে বাঁচায়)
    secure: config.NODE_ENV === 'production', // প্রোডাকশনে শুধু HTTPS
    sameSite: 'strict',    // CSRF থেকে বাঁচায়
    path: COOKIE_PATH,
    maxAge: COOKIE_MAX_AGE,
  });
};

// Refresh Token কুকি মুছে ফেলো (লগআউটের সময়)
export const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie('refreshToken', {
    path: COOKIE_PATH,
  });
};