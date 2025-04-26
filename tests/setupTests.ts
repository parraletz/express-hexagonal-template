// tests/setupTests.ts

const mockRedisStore: Record<string, string> = {}

jest.mock('redis', () => {
  return {
    createClient: jest.fn(() => {
      return {
        connect: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        set: jest.fn((key: string, value: string) => {
          mockRedisStore[key] = value
          return Promise.resolve('OK')
        }),
        get: jest.fn((key: string) => {
          return Promise.resolve(mockRedisStore[key] ?? null)
        }),
        del: jest.fn((key: string) => {
          delete mockRedisStore[key]
          return Promise.resolve(1)
        }),
        quit: jest.fn().mockResolvedValue(undefined)
      }
    })
  }
})
