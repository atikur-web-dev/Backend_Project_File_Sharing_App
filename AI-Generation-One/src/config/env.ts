// src/config/env.ts
import 'dotenv/config';
import { envSchema } from '../zodSchema/env.validation.js';

// এনভ ভ্যারিয়েবল ভ্যালিডেট করো
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment validation failed:');
  console.error(parsed.error.format());
  process.exit(1); // সার্ভার চালু হবে না
}

export const env = parsed.data;