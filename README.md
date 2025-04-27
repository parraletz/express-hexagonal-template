# Express Hexagonal Architecture Boilerplate

## Purpose

This project serves as a robust foundation for building enterprise-grade Node.js applications using Express.js and TypeScript. It implements the Hexagonal Architecture pattern (also known as Ports and Adapters) to create highly maintainable, scalable, and testable applications.

Key objectives of this boilerplate:

- **Separation of Concerns**: Clear boundaries between business logic, application services, and infrastructure
- **Technology Independence**: Easily swap out infrastructure implementations (databases, caches, external services) without affecting core business logic
- **Testing Simplicity**: Isolated components that can be tested independently
- **Maintainability**: Organized codebase that's easy to understand and modify
- **Scalability**: Foundation for building large-scale applications that can evolve over time
- **Best Practices**: Implementation of industry-standard patterns and practices

This boilerplate is ideal for:

- Enterprise applications requiring clean architecture
- Microservices with complex business logic
- Projects that need flexibility in infrastructure choices
- Teams wanting to maintain high code quality and testability

## Getting Started

1. Clone this repository
2. Install dependencies: `pnpm install`
3. Copy `.env.example` to `.env` and configure
4. Run development server: `pnpm dev`
5. Build for production: `pnpm build`
6. Run production server: `pnpm start`
7. Access Swagger docs at: `http://localhost:3000/api-docs`

## Database Management with Prisma ORM

This boilerplate uses Prisma as its primary ORM for database management. Prisma provides type-safe database access, schema migrations, and supports multiple databases including PostgreSQL, MySQL, MariaDB, and MongoDB.

### Setting up Prisma

1. Install Prisma dependencies:

```bash
pnpm add -D prisma
pnpm add @prisma/client
```

2. Initialize Prisma with your database of choice:

```bash
pnpm prisma init --datasource-provider postgresql # or mysql, mongodb, etc.
```

3. Define your schema in `prisma/schema.prisma`. Here's an example with common models:

```prisma
datasource db {
  provider = "postgresql" // or "mysql", "mongodb"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  posts     Post[]
  profile   Profile?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Profile {
  id       String @id @default(uuid())
  bio      String
  user     User   @relation(fields: [userId], references: [id])
  userId   String @unique
}
```

4. Create your repository implementations using Prisma. Example for User repository:

```typescript
// src/infrastructure/repositories/prisma/PrismaUserRepository.ts
import { inject, injectable } from 'inversify'
import { PrismaClient } from '@prisma/client'
import { User, UserEntity } from '@domain/models/User'
import { UserRepository } from '@domain/ports/repositories/UserRepository'
import { TYPES } from '@infrastructure/config/types'
import { Logger } from '@infrastructure/config/logger'

@injectable()
export class PrismaUserRepository implements UserRepository {
  private prisma: PrismaClient

  constructor(@inject(TYPES.Logger) private logger: Logger) {
    this.prisma = new PrismaClient()
  }

  async findById(id: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          profile: true,
          posts: true
        }
      })

      return user ? this.mapToUser(user) : null
    } catch (error) {
      this.logger.error('Error finding user by ID', { error, userId: id })
      throw error
    }
  }

  // ... other repository methods ...
}
```

5. Set up your database connection:

```env
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
```

### Database Migrations and Management

1. Create your first migration:

```bash
pnpm prisma migrate dev --name init
```

2. Generate Prisma Client:

```bash
pnpm prisma generate
```

3. Apply migrations in production:

```bash
pnpm prisma migrate deploy
```

4. View and manage your data with Prisma Studio:

```bash
pnpm prisma studio
```

### Best Practices with Prisma

1. **Schema Organization**:

   - Use meaningful model names
   - Define relationships explicitly
   - Use appropriate field types
   - Add necessary indexes for performance

2. **Repository Pattern**:

   - Keep Prisma client usage within repositories
   - Use domain models in your business logic
   - Map Prisma models to domain entities

3. **Migrations**:

   - Review migration files before applying
   - Test migrations on staging environment
   - Keep migration history clean
   - Use transactions for complex migrations

4. **Performance**:

   - Use `include` and `select` to optimize queries
   - Implement pagination for large datasets
   - Set up proper indexes
   - Monitor query performance

5. **Error Handling**:
   - Handle Prisma-specific errors appropriately
   - Implement retry mechanisms for transient failures
   - Log database operations properly

### Example Service Implementation

```typescript
@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepository,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async createUser(data: CreateUserDTO): Promise<User> {
    try {
      const user = new UserEntity({
        id: uuid(),
        name: data.name,
        email: data.email,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      await this.userRepository.save(user)
      return user
    } catch (error) {
      this.logger.error('Error creating user', { error, data })
      throw error
    }
  }

  async getUserWithPosts(id: string): Promise<User | null> {
    return this.userRepository.findById(id)
  }
}
```

### Testing with Prisma

1. Set up a test database:

```env
# .env.test
DATABASE_URL="postgresql://user:password@localhost:5432/testdb?schema=public"
```

2. Create test utilities:

```typescript
// test/utils/prisma.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function cleanDatabase() {
  const models = Reflect.ownKeys(prisma).filter(key => key[0] !== '_')

  return Promise.all(models.map(model => prisma[model].deleteMany()))
}

export { prisma }
```

3. Example test:

```typescript
import { prisma, cleanDatabase } from '../utils/prisma'
import { UserService } from '@application/services/UserService'

describe('UserService', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  it('should create a user', async () => {
    const service = new UserService()
    const user = await service.createUser({
      name: 'Test User',
      email: 'test@example.com'
    })

    const savedUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    expect(savedUser).toBeDefined()
    expect(savedUser?.email).toBe('test@example.com')
  })
})
```

### Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma Examples](https://github.com/prisma/prisma-examples)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)

## Redis Cache Management

This boilerplate includes a robust Redis caching implementation with automatic reconnection handling and health monitoring.

### Redis Configuration

The Redis client is configured with the following features:

1. **Connection Settings**:

   - Default URL: `redis://localhost:6379`
   - Configurable via `REDIS_URL` environment variable
   - Connection timeout handling
   - Automatic reconnection

2. **Reconnection Strategy**:

   - Initial connection attempts: 3 tries
   - Retry delay between attempts: 5 seconds
   - After max attempts: Enters periodic reconnection mode
   - Periodic reconnection interval: 30 seconds

3. **Health Monitoring**:
   - Endpoint: `/health` or `/healthz`
   - Performs actual Redis operations to verify health
   - Returns detailed status information

### Health Check Response Examples

When Redis is healthy:

```json
{
  "status": "ok",
  "timestamp": "2024-03-21T12:34:56.789Z",
  "uptime": 123.456,
  "redis": {
    "status": "ok",
    "message": "Redis is working properly"
  }
}
```

When Redis is unavailable:

```json
{
  "status": "error",
  "timestamp": "2024-03-21T12:34:56.789Z",
  "uptime": 123.456,
  "redis": {
    "status": "error",
    "message": "Failed to connect to Redis"
  }
}
```

### Redis Connection States

The Redis client can be in one of these states:

1. **Connected**: Normal operation, all cache operations available
2. **Disconnected (Attempting Initial Reconnection)**:
   - Making initial reconnection attempts
   - Maximum 3 attempts with 5-second delays
3. **Disconnected (Periodic Reconnection)**:
   - After initial attempts fail
   - Tries to reconnect every 30 seconds
   - Continues until connection is restored

### Automatic Recovery

The system is designed to automatically recover from Redis failures:

1. When Redis becomes unavailable:

   - Marks cache as unavailable
   - Returns fallback values for all cache operations
   - Starts reconnection process
   - Health check reports error status

2. When Redis becomes available again:
   - Automatically reconnects
   - Restores cache operations
   - Health check returns to normal
   - No manual intervention required

### Cache Operations During Outage

During a Redis outage, the system behaves as follows:

- `get()`: Returns `null`
- `set()`: Returns `false`
- `delete()`: Returns `false`
- `has()`: Returns `false`
- `flush()`: No operation

This ensures your application continues to function even when Redis is temporarily unavailable.

### Environment Variables

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379  # Default Redis connection URL
```
