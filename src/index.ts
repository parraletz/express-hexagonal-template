import 'reflect-metadata';
import dotenv from 'dotenv';
import { container } from '@infrastructure/config/inversify.config';
import { TYPES } from '@infrastructure/config/types';
import { Logger } from '@infrastructure/config/logger';
import { App } from '@infrastructure/config/app';

// Load environment variables
dotenv.config();

// Get container instances
const logger = container.get<Logger>(TYPES.Logger);
const app = container.get<App>(TYPES.App);

// Start server
async function bootstrap() {
  try {
    logger.info('Starting application...', { 
      environment: process.env.NODE_ENV || 'development',
      logLevel: process.env.LOG_LEVEL || 'info'
    });
    
    // Set up Express app
    const expressApp = app.setup(container);
    
    // Start server
    const PORT = process.env.PORT || 3000;
    expressApp.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`, { 
        port: PORT,
        url: `http://localhost:${PORT}`
      });
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing HTTP server');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start application', { error });
    process.exit(1);
  }
}

// Bootstrap the application
bootstrap();
