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
  private readonly reconnectionInterval: number = 30000 // 30 seconds
  private reconnectionTimer: NodeJS.Timeout | null = null

  constructor(@inject(TYPES.Logger) private logger: Logger) {
    this.client = this.createRedisClient()
    this.setupEventListeners()
    this.connect()
  }

  private createRedisClient(): RedisClientType {
    return createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    })
  }

  private setupEventListeners(): void {
    this.client.on('error', err => {
      if (this.isAvailable) {
        this.logger.error('Redis client error', { error: err })
        this.isAvailable = false
        this.startReconnection()
      }
    })

    this.client.on('connect', () => {
      this.isAvailable = true
      this.connectionAttempts = 0
      this.stopReconnectionTimer()
      this.logger.info('Redis connected successfully')
    })
  }

  private startReconnection(): void {
    if (!this.reconnectionTimer) {
      this.reconnectionTimer = setInterval(() => {
        if (!this.isAvailable) {
          this.logger.info('Attempting to reconnect to Redis...')
          this.connectionAttempts = 0
          this.connect()
        }
      }, this.reconnectionInterval)
    }
  }

  private stopReconnectionTimer(): void {
    if (this.reconnectionTimer) {
      clearInterval(this.reconnectionTimer)
      this.reconnectionTimer = null
    }
  }

  private async connect(): Promise<void> {
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      this.logger.warn('Max Redis connection attempts reached, will retry later')
      this.startReconnection()
      return
    }

    try {
      this.connectionAttempts++

      // Create a new client if the current one is closed
      if (this.client.isOpen === false) {
        this.client = this.createRedisClient()
        this.setupEventListeners()
      }

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
        this.logger.warn('Max Redis connection attempts reached, will retry later')
        this.startReconnection()
      }
    }
  }

  private async disconnect(): Promise<void> {
    try {
      this.stopReconnectionTimer()
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
