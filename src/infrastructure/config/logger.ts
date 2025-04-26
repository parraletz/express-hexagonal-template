import { injectable } from 'inversify';
import pino from 'pino';
import os from 'os';

@injectable()
export class Logger {
  private logger: pino.Logger;

  constructor() {
    const logLevel = process.env.LOG_LEVEL || 'info';
    
    // Create a custom transport for development environment
    const transport = process.env.NODE_ENV === 'development' 
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
            }
          }
        } 
      : undefined;
    
    this.logger = pino({
      level: logLevel,
      base: {
        pid: process.pid,
        hostname: os.hostname(),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      ...transport
    });
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(meta || {}, message);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(meta || {}, message);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(meta || {}, message);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.logger.error(meta || {}, message);
  }

  fatal(message: string, meta?: Record<string, unknown>): void {
    this.logger.fatal(meta || {}, message);
  }
}
