import z from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().min(1000),
  APP_URL: z.string().optional(),
  NODE_ENV: z
    .union([z.literal('development'), z.literal('testing'), z.literal('production')])
    .default('development'),
DATABASE_URL:z.string(),
});

const env = envSchema.safeParse(process.env);
if(env.error) {
    throw new Error(env.error.message);
}
export {env}