// src/zodSchema/env.validation.ts
import z from 'zod';

export const envSchema = z.object({
  // নোড এনভায়রনমেন্ট
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  
  // পোর্ট (ডিফল্ট ৮০০০)
  PORT: z.coerce.number().default(8000),
  
  // ডাটাবেস ইউআরএল (অবশ্যই দিতে হবে)
  DATABASE_URL: z.string().url(),
  
  // জেডব্লিউটি সিক্রেট (অবশ্যই দিতে হবে)
  JWT_SECRET: z.string().min(8),
  
  // বাকিগুলো পরে যোগ করবো (Google OAuth, Cloudinary, Gemini)
});