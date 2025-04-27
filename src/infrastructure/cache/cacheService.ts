import { injectable } from 'inversify'
import NodeCache from 'node-cache'

@injectable()
export class CacheService {
  private cache: NodeCache
  private isAvailable: boolean = true

  constructor() {
    try {
      // Default TTL is 5 minutes, checkperiod is 10 minutes
      this.cache = new NodeCache({
        stdTTL: 300,
        checkperiod: 600,
        useClones: false
      })

      // Add error handler for cache errors
      this.cache.on('error', err => {
        console.warn('Cache error occurred:', err)
        this.isAvailable = false
      })
    } catch (error) {
      console.warn('Failed to initialize cache:', error)
      this.isAvailable = false
      // Create a dummy cache to prevent null reference
      this.cache = new NodeCache()
    }
  }

  /**
   * Get a value from the cache
   * @param key - Cache key
   * @returns The cached value or undefined if not found
   */
  get<T>(key: string): T | undefined {
    try {
      if (!this.isAvailable) return undefined
      return this.cache.get<T>(key)
    } catch (error) {
      console.warn(`Error getting cache key ${key}:`, error)
      return undefined
    }
  }

  /**
   * Set a value in the cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds (optional)
   * @returns true if successful, false otherwise
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    try {
      if (!this.isAvailable) return false
      return this.cache.set(key, value, ttl ?? 3600)
    } catch (error) {
      console.warn(`Error setting cache key ${key}:`, error)
      return false
    }
  }

  /**
   * Delete a value from the cache
   * @param key - Cache key
   * @returns Number of deleted entries
   */
  delete(key: string): number {
    try {
      if (!this.isAvailable) return 0
      return this.cache.del(key)
    } catch (error) {
      console.warn(`Error deleting cache key ${key}:`, error)
      return 0
    }
  }

  /**
   * Check if a key exists in the cache
   * @param key - Cache key
   * @returns true if exists, false otherwise
   */
  has(key: string): boolean {
    try {
      if (!this.isAvailable) return false
      return this.cache.has(key)
    } catch (error) {
      console.warn(`Error checking cache key ${key}:`, error)
      return false
    }
  }

  /**
   * Get a value from cache or execute callback to get and cache the value
   * @param key - Cache key
   * @param callback - Function to execute if cache miss
   * @param ttl - Time to live in seconds (optional)
   * @returns The value from callback (cached if possible)
   */
  async getOrSet<T>(key: string, callback: () => Promise<T>, ttl?: number): Promise<T> {
    try {
      if (this.isAvailable) {
        const cachedValue = this.get<T>(key)
        if (cachedValue !== undefined) {
          return cachedValue
        }
      }

      const value = await callback()

      if (this.isAvailable) {
        this.set(key, value, ttl)
      }

      return value
    } catch (error) {
      console.warn(`Error in getOrSet for key ${key}:`, error)
      // If cache fails, just return the callback value
      return callback()
    }
  }

  /**
   * Flush the entire cache
   */
  flush(): void {
    try {
      if (!this.isAvailable) return
      this.cache.flushAll()
    } catch (error) {
      console.warn('Error flushing cache:', error)
    }
  }

  /**
   * Check if the cache service is available
   */
  isHealthy(): boolean {
    return this.isAvailable
  }
}
