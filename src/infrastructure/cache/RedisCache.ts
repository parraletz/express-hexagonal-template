import { CacheService } from '@domain/ports/cache/CacheService'
import { Logger } from '@infrastructure/config/logger'
import { TYPES } from '@infrastructure/config/types'
import { inject, injectable } from 'inversify'
import { createClient, RedisClientType } from 'redis'

@injectable()
export class RedisCache implements CacheService {
  private client: RedisClientType
  private readonly defaultTtl: number = 3600 // 1 hour in seconds

  constructor(@inject(TYPES.Logger) private logger: Logger) {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    })

    this.client.on('error', err => {
      this.logger.error('Redis client error', { error: err })
    })

    this.connect()
  }

  private async connect(): Promise<void> {
    try {
      await this.client.connect()
      this.logger.info('Redis connected successfully')
    } catch (error) {
      this.logger.error('Redis connection error', { error })
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key)
      if (!data) return null

      return JSON.parse(data) as T
    } catch (error) {
      this.logger.error('Redis get error', { error, key })
      return null
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const expiry = ttl || this.defaultTtl
      await this.client.setEx(key, expiry, JSON.stringify(value))
      return true
    } catch (error) {
      this.logger.error('Redis set error', { error, key })
      return false
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.client.del(key)
      return true
    } catch (error) {
      this.logger.error('Redis delete error', { error, key })
      return false
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      return (await this.client.exists(key)) === 1
    } catch (error) {
      this.logger.error('Redis exists error', { error, key })
      return false
    }
  }

  async flush(): Promise<void> {
    try {
      await this.client.flushAll()
    } catch (error) {
      this.logger.error('Redis flush error', { error })
    }
  }
}
