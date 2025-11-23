import http from 'http';

import app from './app';
import { config, logger } from './config';
import prisma from './utils/prisma.client';

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

async function startServer() {
  try {
    // Connect to database
    await prisma.$connect();
    logger.info('Connected to database');

    // Create an HTTP server from the Express app
    const httpServer = http.createServer(app);
    // Start the server
    httpServer.listen(config.PORT, () => {
      logger.info(`Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
      logger.info(`API is available at http://localhost:${config.PORT}${config.API_PREFIX}`);
      logger.info(`Health check endpoint: http://localhost:${config.PORT}${config.API_PREFIX}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
