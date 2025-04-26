export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  flush(): Promise<void>;
}
