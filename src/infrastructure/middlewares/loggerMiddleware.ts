import { Request, Response, NextFunction } from 'express';
import { Logger } from '@infrastructure/config/logger';
import { container } from '@infrastructure/config/inversify.config';
import { TYPES } from '@infrastructure/config/types';

export function loggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const logger = container.get<Logger>(TYPES.Logger);
  const startTime = Date.now();

  // Generate a unique request ID
  const requestId = Math.random().toString(36).substring(2, 15);
  
  // Store requestId for use in the response
  res.locals.requestId = requestId;

  // Log the incoming request
  logger.info('Request received', {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Log the response when it's sent
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logMethod = res.statusCode >= 400 ? 'error' : 'info';
    
    const logMessage = res.statusCode >= 400 ? 'Request failed' : 'Request completed';
    
    logger[logMethod](logMessage, {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length')
    });
  });

  next();
}
