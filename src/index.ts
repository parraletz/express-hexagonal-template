import { CacheService } from '@domain/ports/cache/CacheService'
import { createTerminus } from '@godaddy/terminus'
import { App } from '@infrastructure/config/app'
import { container } from '@infrastructure/config/inversify.config'
import { Logger } from '@infrastructure/config/logger'
import { TYPES } from '@infrastructure/config/types'
import dotenv from 'dotenv'
import http from 'http'
import 'reflect-metadata'

// Load environment variables
dotenv.config()

// Get container instances
const logger = container.get<Logger>(TYPES.Logger)
const app = container.get<App>(TYPES.App)
const cacheService = container.get<CacheService>(TYPES.CacheService)

// Health check functions
const healthCheck = async () => {
  try {
    // Check Redis health by trying to set and get a value
    const testKey = 'health-check-test'
    const testValue = { test: 'ok' }

    // Try to set a value
    const setResult = await cacheService.set(testKey, testValue)
    if (!setResult) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        redis: {
          status: 'error',
          message: 'Failed to set test value in Redis'
        }
      }
    }

    // Try to get the value back
    const getValue = await cacheService.get<typeof testValue>(testKey)
    if (!getValue) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        redis: {
          status: 'error',
          message: 'Failed to get test value from Redis'
        }
      }
    }

    // Clean up test key
    await cacheService.delete(testKey)

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      redis: {
        status: 'ok',
        message: 'Redis is working properly'
      }
    }
  } catch (error) {
    logger.error('Health check failed', { error })
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      redis: {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }
}

// Start server
async function bootstrap() {
  try {
    logger.info('Starting application...', {
      environment: process.env.NODE_ENV || 'development',
      logLevel: process.env.LOG_LEVEL || 'info'
    })

    // Set up Express app
    const expressApp = app.setup(container)

    // Create HTTP server
    const server = http.createServer(expressApp)

    // Terminus configuration
    createTerminus(server, {
      signal: 'SIGINT',
      healthChecks: {
        '/health': healthCheck,
        '/healthz': healthCheck, // Kubernetes convention
        verbatim: true
      },
      onSignal: async () => {
        logger.info('Cleanup started')
        // Add your cleanup logic here
        // For example, close database connections
      },
      onShutdown: async () => {
        logger.info('Cleanup finished, server is shutting down')
      },
      logger: (msg, err) => {
        if (err) {
          logger.error(msg, { error: err })
        } else {
          logger.info(msg)
        }
      }
    })

    // Start server
    const PORT = process.env.PORT || 3000
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`, {
        port: PORT,
        url: `http://localhost:${PORT}`
      })
    })
  } catch (error) {
    logger.error('Failed to start application', { error })
    process.exit(1)
  }
}

// Bootstrap the application
bootstrap()
