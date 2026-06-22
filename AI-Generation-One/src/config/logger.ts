// src/config/logger.ts
import winston from 'winston';
import { env } from './env.js';

const { combine, timestamp, printf, colorize, json } = winston.format;

// কাস্টম ফরম্যাট (ডেভেলপমেন্টে রঙিন, প্রোডাকশনে JSON)
const myFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  env.NODE_ENV === 'production' 
    ? json() 
    : combine(colorize(), printf(({ level, message, timestamp }) => {
        return `${timestamp} ${level}: ${message}`;
      }))
);

// ট্রান্সপোর্ট (কোথায় লগ লেখা হবে)
const transports = env.NODE_ENV === 'production'
  ? [
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' }),
    ]
  : [new winston.transports.Console()];

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: myFormat,
  transports,
});