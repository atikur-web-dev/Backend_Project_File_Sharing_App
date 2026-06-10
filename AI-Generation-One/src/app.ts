// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { prisma } from './prisma.js';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error });
  }
});

export { app, prisma };