# Express Hexagonal Architecture Boilerplate

A production-ready Express.js boilerplate with TypeScript implementing Hexagonal (Ports & Adapters) Architecture, designed for building scalable and maintainable web services.

## What is Hexagonal Architecture?

Also known as "Ports and Adapters," Hexagonal Architecture organizes your application into three main layers:

- **Domain Layer**: Contains business logic, entities, and rules that represent your core application concepts
- **Application Layer**: Implements use cases by coordinating domain objects to perform specific tasks
- **Infrastructure Layer**: Provides concrete implementations for external interfaces (databases, APIs, UI)

The key benefit is that your core business logic remains isolated from external concerns, making your application:
- More testable with clearer boundaries
- Easier to maintain and evolve over time
- Technology-agnostic, allowing you to swap implementations without affecting core functionality

## What This Boilerplate Provides

This boilerplate implements a complete foundation for Express.js services with:

1. **Complete Project Structure**: Ready-to-use directory organization following hexagonal principles
2. **Working API Examples**: User management endpoints with CRUD operations
3. **High-Performance Logging**: Structured JSON logs with Pino for improved monitoring
4. **Automatic API Documentation**: Swagger integration for interactive API exploration
5. **Dependency Injection**: Inversify for clean dependency management
6. **Infrastructure Independence**: Pluggable repository implementations
7. **Developer Experience**: Fast compile times with SWC, hot reloading, clear error handling

## Features

- **Hexagonal Architecture**: Clean separation between domain, application, and infrastructure layers
- **TypeScript**: Type-safe development experience with SWC for fast compilation
- **Express.js**: Fast, unopinionated web framework
- **File-based Repository**: Simple JSON file storage for development
- **Structured Logging**: Pino logger with JSON output format
- **Dependency Injection**: Inversify for clean dependency management
- **Validation**: Class-validator for input validation
- **Caching**: Integrated caching system with TTL support
- **API Documentation**: OpenAPI/Swagger integration
- **Testing**: Jest with SWC for fast unit and integration testing
- **Error Handling**: Centralized error handling
- **Docker & Kubernetes**: Ready for containerized deployments
- **Security**: Helmet integration for HTTP security headers

## Getting Started

1. Clone this repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure
4. Run development server: `npm run dev`
5. Build for production: `npm run build`
6. Run production server: `npm start`
7. Access Swagger docs at: `http://localhost:3000/api-docs`

## Repository Implementations

The boilerplate currently includes an in-memory repository implementation for development, but you can easily swap it with other database connectors.

### Using PostgreSQL

To implement a PostgreSQL repository:

1. Install required packages:
```bash
npm install pg @types/pg
```

2. Create a PostgreSQL repository implementation:

```typescript
// src/infrastructure/repositories/postgres/PostgresUserRepository.ts
import { inject, injectable } from 'inversify';
import { Pool } from 'pg';
import { User, UserEntity } from '@domain/models/User';
import { UserRepository } from '@domain/ports/repositories/UserRepository';
import { TYPES } from '@infrastructure/config/types';
import { Logger } from '@infrastructure/config/logger';

@injectable()
export class PostgresUserRepository implements UserRepository {
  private pool: Pool;

  constructor(@inject(TYPES.Logger) private logger: Logger) {
    this.pool = new Pool({
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
    });
  }

  async findById(id: string): Promise<User | null> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapToUser(result.rows[0]);
    } catch (error) {
      this.logger.error('Error finding user by ID', { error, userId: id });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapToUser(result.rows[0]);
    } catch (error) {
      this.logger.error('Error finding user by email', { error, email });
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    try {
      const result = await this.pool.query('SELECT * FROM users');
      return result.rows.map(row => this.mapToUser(row));
    } catch (error) {
      this.logger.error('Error finding all users', { error });
      throw error;
    }
  }

  async save(user: User): Promise<void> {
    try {
      await this.pool.query(
        'INSERT INTO users (id, name, email, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)',
        [user.id, user.name, user.email, user.createdAt, user.updatedAt]
      );
    } catch (error) {
      this.logger.error('Error saving user', { error, userId: user.id });
      throw error;
    }
  }

  async update(user: User): Promise<void> {
    try {
      await this.pool.query(
        'UPDATE users SET name = $1, email = $2, updated_at = $3 WHERE id = $4',
        [user.name, user.email, user.updatedAt, user.id]
      );
    } catch (error) {
      this.logger.error('Error updating user', { error, userId: user.id });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.pool.query('DELETE FROM users WHERE id = $1', [id]);
    } catch (error) {
      this.logger.error('Error deleting user', { error, userId: id });
      throw error;
    }
  }

  private mapToUser(row: any): User {
    return new UserEntity({
      id: row.id,
      name: row.name,
      email: row.email,
    });
  }
}
```

3. Update your inversify configuration to use the PostgreSQL repository:

```typescript
// In src/infrastructure/config/inversify.config.ts
import { PostgresUserRepository } from '@infrastructure/repositories/postgres/PostgresUserRepository';

// Then replace the binding:
container.bind<UserRepository>(TYPES.UserRepository).to(PostgresUserRepository).inSingletonScope();
```

4. Add environment variables to your `.env` file:

```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=your_database
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
```

### Using MongoDB

To implement a MongoDB repository:

1. Install required packages:
```bash
npm install mongodb
```

2. Create a MongoDB repository implementation:

```typescript
// src/infrastructure/repositories/mongo/MongoUserRepository.ts
import { inject, injectable } from 'inversify';
import { MongoClient, Collection, Db } from 'mongodb';
import { User, UserEntity } from '@domain/models/User';
import { UserRepository } from '@domain/ports/repositories/UserRepository';
import { TYPES } from '@infrastructure/config/types';
import { Logger } from '@infrastructure/config/logger';

@injectable()
export class MongoUserRepository implements UserRepository {
  private client: MongoClient;
  private db: Db;
  private collection: Collection;

  constructor(@inject(TYPES.Logger) private logger: Logger) {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_DB || 'hexagonal_api';
    
    this.client = new MongoClient(uri);
    this.db = this.client.db(dbName);
    this.collection = this.db.collection('users');
    
    this.connect();
  }

  private async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.logger.info('Connected to MongoDB');
    } catch (error) {
      this.logger.error('MongoDB connection error', { error });
      throw error;
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const document = await this.collection.findOne({ id });
      if (!document) {
        return null;
      }
      return this.mapToUser(document);
    } catch (error) {
      this.logger.error('Error finding user by ID', { error, userId: id });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const document = await this.collection.findOne({ email });
      if (!document) {
        return null;
      }
      return this.mapToUser(document);
    } catch (error) {
      this.logger.error('Error finding user by email', { error, email });
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    try {
      const documents = await this.collection.find().toArray();
      return documents.map(doc => this.mapToUser(doc));
    } catch (error) {
      this.logger.error('Error finding all users', { error });
      throw error;
    }
  }

  async save(user: User): Promise<void> {
    try {
      await this.collection.insertOne({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    } catch (error) {
      this.logger.error('Error saving user', { error, userId: user.id });
      throw error;
    }
  }

  async update(user: User): Promise<void> {
    try {
      await this.collection.updateOne(
        { id: user.id },
        {
          $set: {
            name: user.name,
            email: user.email,
            updatedAt: user.updatedAt
          }
        }
      );
    } catch (error) {
      this.logger.error('Error updating user', { error, userId: user.id });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.collection.deleteOne({ id });
    } catch (error) {
      this.logger.error('Error deleting user', { error, userId: id });
      throw error;
    }
  }

  private mapToUser(document: any): User {
    return new UserEntity({
      id: document.id,
      name: document.name,
      email: document.email
    });
  }
}
```

3. Update your inversify configuration:

```typescript
// In src/infrastructure/config/inversify.config.ts
import { MongoUserRepository } from '@infrastructure/repositories/mongo/MongoUserRepository';

// Then replace the binding:
container.bind<UserRepository>(TYPES.UserRepository).to(MongoUserRepository).inSingletonScope();
```

4. Add MongoDB connection details to your `.env` file:

```
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=hexagonal_api
```

### Using MySQL

1. Install required packages:
```bash
npm install mysql2
```

2. Create a MySQL repository implementation:

```typescript
// src/infrastructure/repositories/mysql/MySQLUserRepository.ts
import { inject, injectable } from 'inversify';
import mysql from 'mysql2/promise';
import { User, UserEntity } from '@domain/models/User';
import { UserRepository } from '@domain/ports/repositories/UserRepository';
import { TYPES } from '@infrastructure/config/types';
import { Logger } from '@infrastructure/config/logger';

@injectable()
export class MySQLUserRepository implements UserRepository {
  private pool: mysql.Pool;

  constructor(@inject(TYPES.Logger) private logger: Logger) {
    this.pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      database: process.env.MYSQL_DB,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  async findById(id: string): Promise<User | null> {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      return this.mapToUser(rows[0]);
    } catch (error) {
      this.logger.error('Error finding user by ID', { error, userId: id });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      return this.mapToUser(rows[0]);
    } catch (error) {
      this.logger.error('Error finding user by email', { error, email });
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    try {
      const [rows] = await this.pool.query('SELECT * FROM users');
      
      if (!Array.isArray(rows)) {
        return [];
      }
      
      return rows.map(row => this.mapToUser(row));
    } catch (error) {
      this.logger.error('Error finding all users', { error });
      throw error;
    }
  }

  async save(user: User): Promise<void> {
    try {
      await this.pool.execute(
        'INSERT INTO users (id, name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [user.id, user.name, user.email, user.createdAt, user.updatedAt]
      );
    } catch (error) {
      this.logger.error('Error saving user', { error, userId: user.id });
      throw error;
    }
  }

  async update(user: User): Promise<void> {
    try {
      await this.pool.execute(
        'UPDATE users SET name = ?, email = ?, updated_at = ? WHERE id = ?',
        [user.name, user.email, user.updatedAt, user.id]
      );
    } catch (error) {
      this.logger.error('Error updating user', { error, userId: user.id });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.pool.execute('DELETE FROM users WHERE id = ?', [id]);
    } catch (error) {
      this.logger.error('Error deleting user', { error, userId: id });
      throw error;
    }
  }

  private mapToUser(row: any): User {
    return new UserEntity({
      id: row.id,
      name: row.name,
      email: row.email
    });
  }
}
```

### Using Elasticsearch

1. Install required packages:
```bash
npm install @elastic/elasticsearch
```

2. Create an Elasticsearch repository implementation:

```typescript
// src/infrastructure/repositories/elasticsearch/ElasticsearchUserRepository.ts
import { inject, injectable } from 'inversify';
import { Client } from '@elastic/elasticsearch';
import { User, UserEntity } from '@domain/models/User';
import { UserRepository } from '@domain/ports/repositories/UserRepository';
import { TYPES } from '@infrastructure/config/types';
import { Logger } from '@infrastructure/config/logger';

@injectable()
export class ElasticsearchUserRepository implements UserRepository {
  private client: Client;
  private index: string = 'users';

  constructor(@inject(TYPES.Logger) private logger: Logger) {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
      auth: {
        username: process.env.ELASTICSEARCH_USERNAME || '',
        password: process.env.ELASTICSEARCH_PASSWORD || ''
      }
    });
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const indexExists = await this.client.indices.exists({ index: this.index });
      
      if (!indexExists) {
        await this.client.indices.create({
          index: this.index,
          body: {
            mappings: {
              properties: {
                id: { type: 'keyword' },
                name: { type: 'text' },
                email: { type: 'keyword' },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' }
              }
            }
          }
        });
        this.logger.info(`Created '${this.index}' index in Elasticsearch`);
      }
    } catch (error) {
      this.logger.error('Error initializing Elasticsearch', { error });
      throw error;
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const response = await this.client.get({
        index: this.index,
        id: id
      });
      
      if (!response.found) {
        return null;
      }
      
      return this.mapToUser(response._source);
    } catch (error) {
      if (error.meta?.statusCode === 404) {
        return null;
      }
      this.logger.error('Error finding user by ID', { error, userId: id });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const response = await this.client.search({
        index: this.index,
        body: {
          query: {
            term: { email: email }
          }
        }
      });
      
      if (response.hits.total.value === 0) {
        return null;
      }
      
      return this.mapToUser(response.hits.hits[0]._source);
    } catch (error) {
      this.logger.error('Error finding user by email', { error, email });
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    try {
      const response = await this.client.search({
        index: this.index,
        body: {
          query: { match_all: {} }
        }
      });
      
      return response.hits.hits.map(hit => this.mapToUser(hit._source));
    } catch (error) {
      this.logger.error('Error finding all users', { error });
      throw error;
    }
  }

  async save(user: User): Promise<void> {
    try {
      await this.client.index({
        index: this.index,
        id: user.id,
        body: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        refresh: true
      });
    } catch (error) {
      this.logger.error('Error saving user', { error, userId: user.id });
      throw error;
    }
  }

  async update(user: User): Promise<void> {
    try {
      await this.client.update({
        index: this.index,
        id: user.id,
        body: {
          doc: {
            name: user.name,
            email: user.email,
            updatedAt: user.updatedAt
          }
        },
        refresh: true
      });
    } catch (error) {
      this.logger.error('Error updating user', { error, userId: user.id });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.client.delete({
        index: this.index,
        id: id,
        refresh: true
      });
    } catch (error) {
      if (error.meta?.statusCode === 404) {
        return;
      }
      this.logger.error('Error deleting user', { error, userId: id });
      throw error;
    }
  }

  private mapToUser(source: any): User {
    return new UserEntity({
      id: source.id,
      name: source.name,
      email: source.email
    });
  }
}
```

## Switching Between Implementations

The beauty of Hexagonal Architecture is how easy it is to switch implementations:

1. Create your repository implementation that adheres to the `UserRepository` interface
2. Update your inversify.config.ts to bind the new implementation:
   ```typescript
   // For development
   container.bind<UserRepository>(TYPES.UserRepository).to(InMemoryUserRepository).inSingletonScope();
   
   // For production
   container.bind<UserRepository>(TYPES.UserRepository).to(PostgresUserRepository).inSingletonScope();
   ```
3. You can even implement environment-based switching:
   ```typescript
   if (process.env.NODE_ENV === 'production') {
     container.bind<UserRepository>(TYPES.UserRepository).to(PostgresUserRepository).inSingletonScope();
   } else {
     container.bind<UserRepository>(TYPES.UserRepository).to(InMemoryUserRepository).inSingletonScope();
   }
   ```

## Logging with Pino

This boilerplate uses [Pino](https://getpino.io/) for high-performance logging:

### Log Format

Logs are output in JSON format with the following standardized fields:
- `level`: Numeric log level (10=trace, 20=debug, 30=info, 40=warn, 50=error, 60=fatal)
- `time`: ISO timestamp
- `pid`: Process ID
- `hostname`: Server hostname
- `msg`: Log message
- Additional context fields

Example log entry:
```json
{"level":30,"time":"2025-04-26T12:34:56.789Z","pid":2376870,"hostname":"myserver","msg":"Request received","requestId":"abcd1234","method":"GET","url":"/api/users"}
```

### HTTP Request Logging

All HTTP requests are automatically logged with:
- Unique request ID
- Method, URL, and status code
- Request duration
- IP address and user agent
- Response status and size

### Usage

The logger is available via dependency injection:

```typescript
import { inject } from 'inversify';
import { TYPES } from '@infrastructure/config/types';
import { Logger } from '@infrastructure/config/logger';

constructor(@inject(TYPES.Logger) private logger: Logger) {}

public myMethod(): void {
  this.logger.info('Processing data', { key: 'value', count: 42 });
  
  try {
    // Some operation
  } catch (error) {
    this.logger.error('Operation failed', { error, operationId: '123' });
  }
}
```

### Log Levels

Available log methods:
- `logger.debug()`: Detailed information for debugging
- `logger.info()`: Confirmation that things are working as expected
- `logger.warn()`: Warning about potential issues
- `logger.error()`: Error events that might still allow the application to continue
- `logger.fatal()`: Severe error events that may cause the application to terminate

The log level can be set via the `LOG_LEVEL` environment variable (default: 'info').

## API Documentation with Swagger

This boilerplate includes comprehensive API documentation using Swagger/OpenAPI:

- **Interactive Documentation**: Available at `/api-docs` endpoint when running the server
- **Auto-generated**: Documentation is generated from code annotations
- **Request/Response Examples**: Full examples to guide API usage
- **Schema Validation**: Clear definitions of expected data structures

### Using Swagger UI

Once the application is running, navigate to `/api-docs` in your browser to:

- Browse available endpoints grouped by tags
- View request parameters, body schemas, and responses
- Try out API calls directly from the browser
- Inspect response codes and structures

### Documenting New Endpoints

Use JSDoc comments with Swagger annotations to document your controllers:

```typescript
/**
 * @swagger
 * /api/resource:
 *   get:
 *     summary: Brief description
 *     description: Detailed explanation
 *     tags: [ResourceTag]
 *     responses:
 *       200:
 *         description: Success response description
 */
@httpGet('/')
public getResources() {
  // Method implementation
}
```

## Testing

Run tests with: `npm test`

This boilerplate uses Jest with SWC for fast test execution.

## License

MIT
