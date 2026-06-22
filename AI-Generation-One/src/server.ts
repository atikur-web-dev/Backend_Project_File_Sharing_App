// src/server.ts
import 'dotenv/config';
import { app } from './app.js';
import { config } from './config/index.js';
import { logger } from './config/logger.js';

const { PORT } = config;

// Prisma কানেকশন চেক (ঐচ্ছিক)
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function startServer() {
  try {
    // ডাটাবেস কানেকশন চেক
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
    
    // সার্ভার স্টার্ট
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on ${config.APP_URL}`);
      logger.info(`📁 Environment: ${config.NODE_ENV}`);
      logger.info(`🔗 Health check: ${config.APP_URL}/health`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();