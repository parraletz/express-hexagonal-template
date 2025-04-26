import { Request, Response } from 'express';
import { controller, httpGet, request, response } from 'inversify-express-utils';
import { inject } from 'inversify';
import { TYPES } from '@infrastructure/config/types';
import { Logger } from '@infrastructure/config/logger';

/**
 * @swagger
 * tags:
 *   name: Home
 *   description: API home and health endpoints
 */
@controller('/api')
export class HomeController {
  constructor(@inject(TYPES.Logger) private logger: Logger) {}

  /**
   * @swagger
   * /api:
   *   get:
   *     summary: Get API status
   *     description: Returns the status of the API
   *     tags: [Home]
   *     responses:
   *       200:
   *         description: API is running
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Express Hexagonal API is running!
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                 version:
   *                   type: string
   *                   example: 1.0.0
   */
  @httpGet('/')
  public index(@request() req: Request, @response() res: Response) {
    this.logger.info('API home endpoint called', { 
      ip: req.ip,
      method: req.method,
      path: req.path
    });
    
    return res.json({
      status: 'success',
      message: 'Express Hexagonal API is running!',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  }

  /**
   * @swagger
   * /api/health:
   *   get:
   *     summary: Health check
   *     description: Returns the health status of the API
   *     tags: [Home]
   *     responses:
   *       200:
   *         description: API is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: ok
   *                 uptime:
   *                   type: number
   *                   example: 42.123
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  @httpGet('/health')
  public health(@request() req: Request, @response() res: Response) {
    this.logger.debug('Health check endpoint called', { ip: req.ip });
    
    return res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  }
}
