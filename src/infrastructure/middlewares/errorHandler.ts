import { container } from '@infrastructure/config/inversify.config'
import { Logger } from '@infrastructure/config/logger'
import { TYPES } from '@infrastructure/config/types'
import { NextFunction, Request, Response } from 'express'

export interface AppError extends Error {
  statusCode?: number
  code?: string
}

export const errorHandler = (error: AppError, req: Request, res: Response, next: NextFunction) => {
  const logger = container.get<Logger>(TYPES.Logger)
  const statusCode = error.statusCode || 500

  logger.error(`Error: ${error.message}`, {
    error,
    path: req.path,
    method: req.method,
    ip: req.ip
  })

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message: statusCode === 500 ? 'Internal server error' : error.message,
    code: error.code || 'INTERNAL_ERROR'
  })
}
