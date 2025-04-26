import { Logger } from '@infrastructure/config/logger'
import { TYPES } from '@infrastructure/config/types'
import { inject, injectable } from 'inversify'

@injectable()
export class Database {
  constructor(@inject(TYPES.Logger) private logger: Logger) {}

  async connect(): Promise<void> {
    // This is a no-op in the JSON repository implementation
    this.logger.info('JSON file repository initialized')
    return Promise.resolve()
  }

  async disconnect(): Promise<void> {
    // This is a no-op in the JSON repository implementation
    this.logger.info('JSON file repository shutdown')
    return Promise.resolve()
  }
}
