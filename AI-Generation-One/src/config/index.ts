// src/config/index.ts
import { env } from './env.js';

export const config = {
  // সব এনভ ভ্যারিয়েবল
  ...env,
  
  // অ্যাপ ইউআরএল (অটো জেনারেট)
  APP_URL: env.NODE_ENV === 'development' 
    ? `http://localhost:${env.PORT}` 
    : process.env.APP_URL || '',
};