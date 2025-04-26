import { Logger } from '@infrastructure/config/logger'
import { SwaggerConfig } from '@infrastructure/config/swagger'
import { TYPES } from '@infrastructure/config/types'
import { loggerMiddleware } from '@infrastructure/middlewares/loggerMiddleware'
import cors from 'cors'
import express, { Express } from 'express'
import helmet from 'helmet'
import { inject, injectable } from 'inversify'
import { InversifyExpressServer } from 'inversify-express-utils'
import 'reflect-metadata'

@injectable()
export class App {
  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.SwaggerConfig) private swaggerConfig: SwaggerConfig
  ) {}

  public setup(container: any) {
    const server = new InversifyExpressServer(container)

    server.setConfig(app => {
      app.use(helmet())
      app.use(cors())

      app.use(loggerMiddleware)

      app.use(express.json())
      app.use(express.urlencoded({ extended: true }))

      app.get('/', (_, res) => {
        res.status(200).json({
          message: 'Express Hexagonal API is running!',
          timestamp: new Date().toISOString()
        })
      })
    })

    server.setErrorConfig(app => {
      app.use(
        (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
          this.logger.error('Unhandled error', { error: err, path: req.path, method: req.method })
          res.status(500).json({
            status: 'error',
            message: 'Internal Server Error'
          })
        }
      )
    })

    const expressApp = server.build() as unknown as Express

    this.swaggerConfig.setup(expressApp)

    return expressApp
  }
}
