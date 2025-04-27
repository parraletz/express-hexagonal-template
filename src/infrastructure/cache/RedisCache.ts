import { CacheService } from '@domain/ports/cache/CacheService'
import { Logger } from '@infrastructure/config/logger'
import { TYPES } from '@infrastructure/config/types'
import { inject, injectable } from 'inversify'
import { createClient, RedisClientType } from 'redis'

@injectable()
export class RedisCache implements CacheService {
  private client: RedisClientType
  private readonly defaultTtl: number = 3600
  private isAvailable: boolean = false
  private connectionAttempts: number = 0
  private readonly maxConnectionAttempts: number = 3
  private readonly connectionRetryDelay: number = 5000 // 5 seconds

  constructor(@inject(TYPES.Logger) private logger: Logger) {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    })

    this.client.on('error', err => {
      // Only log as error if we were previously connected
      if (this.isAvailable) {
        this.logger.error('Redis client error', { error: err })
        this.isAvailable = false
        // Try to reconnect once if we lose an established connection
        if (this.connectionAttempts < this.maxConnectionAttempts) {
          this.connectionAttempts = 0
          setTimeout(() => this.connect(), this.connectionRetryDelay)
        }
      }
    })

    this.client.on('connect', () => {
      this.isAvailable = true
      this.connectionAttempts = 0
      this.logger.info('Redis connected successfully')
    })

    // Initial connection attempt
    this.connect()
  }

  private async connect(): Promise<void> {
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      this.logger.warn('Max Redis connection attempts reached, falling back to no-cache mode')
      await this.disconnect()
      return
    }

    try {
      this.connectionAttempts++
      await this.client.connect()
      this.isAvailable = true
      this.logger.info('Redis connected successfully')
    } catch (error) {
      this.isAvailable = false

      if (this.connectionAttempts < this.maxConnectionAttempts) {
        this.logger.warn(
          `Redis connection attempt ${this.connectionAttempts} failed, retrying in ${this.connectionRetryDelay / 1000}s`,
          { error }
        )
        setTimeout(() => this.connect(), this.connectionRetryDelay)
      } else {
        this.logger.warn('Max Redis connection attempts reached, falling back to no-cache mode')
        await this.disconnect()
      }
    }
  }

  private async disconnect(): Promise<void> {
    try {
      await this.client.quit()
    } catch (error) {
      // Ignore error on disconnect
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable) return null
    try {
      const data = await this.client.get(key)
      if (!data) return null

      return JSON.parse(data) as T
    } catch (error) {
      this.logger.warn('Redis get operation failed', { error, key })
      return null
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    if (!this.isAvailable) return false
    try {
      const expiry = ttl || this.defaultTtl
      await this.client.setEx(key, expiry, JSON.stringify(value))
      return true
    } catch (error) {
      this.logger.warn('Redis set operation failed', { error, key })
      return false
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.isAvailable) return false
    try {
      await this.client.del(key)
      return true
    } catch (error) {
      this.logger.warn('Redis delete operation failed', { error, key })
      return false
    }
  }

  async has(key: string): Promise<boolean> {
    if (!this.isAvailable) return false
    try {
      return (await this.client.exists(key)) === 1
    } catch (error) {
      this.logger.warn('Redis exists operation failed', { error, key })
      return false
    }
  }

  async flush(): Promise<void> {
    if (!this.isAvailable) return
    try {
      await this.client.flushAll()
    } catch (error) {
      this.logger.warn('Redis flush operation failed', { error })
    }
  }

  isHealthy(): boolean {
    return this.isAvailable
  }
}
