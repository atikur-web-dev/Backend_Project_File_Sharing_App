// src/app.ts
import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { logger } from './config/logger.js';
import { config } from './config/index.js';

const app: Application = express();

// =============== মিডলওয়্যার ===============

// 1. হেলমেট - HTTP হেডার সুরক্ষা
app.use(helmet());

// 2. CORS - ক্রস-অরিজিন রিকোয়েস্ট অনুমতি
app.use(cors({
  origin: config.NODE_ENV === 'development' ? '*' : process.env.CLIENT_URL,
  credentials: true,
}));

// 3. কুকি পার্সার
app.use(cookieParser());

// 4. JSON বডি পার্সার (সীমা ১০এমবি)
app.use(express.json({ limit: '10mb' }));

// 5. URL এনকোডেড বডি
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. মরগান লগিং (HTTP রিকোয়েস্ট লগ)
app.use(morgan('dev'));

// =============== হেলথ চেক রুট ===============

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

// =============== ৪০৪ হ্যান্ডলার ===============

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// =============== গ্লোবাল এরর হ্যান্ডলার ===============

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.stack || err.message);
  
  res.status(500).json({
    success: false,
    message: config.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

export { app };