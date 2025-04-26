import { injectable } from 'inversify'
import NodeCache from 'node-cache'

@injectable()
export class CacheService {
  private cache: NodeCache

  constructor() {
    // Default TTL is 5 minutes, checkperiod is 10 minutes
    this.cache = new NodeCache({
      stdTTL: 300,
      checkperiod: 600,
      useClones: false
    })
  }

  /**
   * Get a value from the cache
   * @param key - Cache key
   * @returns The cached value or undefined if not found
   */
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key)
  }

  /**
   * Set a value in the cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds (optional)
   * @returns true if successful, false otherwise
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl ?? 3600)
  }

  /**
   * Delete a value from the cache
   * @param key - Cache key
   * @returns Number of deleted entries
   */
  delete(key: string): number {
    return this.cache.del(key)
  }

  /**
   * Check if a key exists in the cache
   * @param key - Cache key
   * @returns true if exists, false otherwise
   */
  has(key: string): boolean {
    return this.cache.has(key)
  }

  /**
   * Get a value from cache or execute callback to get and cache the value
   * @param key - Cache key
   * @param callback - Function to execute if cache miss
   * @param ttl - Time to live in seconds (optional)
   * @returns The value from cache or callback
   */
  async getOrSet<T>(key: string, callback: () => Promise<T>, ttl?: number): Promise<T> {
    const cachedValue = this.get<T>(key)

    if (cachedValue !== undefined) {
      return cachedValue
    }

    const value = await callback()
    this.set(key, value, ttl)
    return value
  }

  /**
   * Flush the entire cache
   */
  flush(): void {
    this.cache.flushAll()
  }
}
