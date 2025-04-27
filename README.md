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

## Creating a New Domain

This section demonstrates how to create a complete domain using Books as an example. We'll follow the hexagonal architecture principles to implement all necessary components.

### 1. Domain Layer

First, define your domain entities and interfaces in the domain layer:

```typescript
// src/domain/models/Book.ts
export interface Book {
  id: string
  title: string
  author: string
  isbn: string
  publishedAt: Date
  createdAt: Date
  updatedAt: Date
}

export class BookEntity implements Book {
  id: string
  title: string
  author: string
  isbn: string
  publishedAt: Date
  createdAt: Date
  updatedAt: Date

  constructor(props: Book) {
    this.id = props.id
    this.title = props.title
    this.author = props.author
    this.isbn = props.isbn
    this.publishedAt = props.publishedAt
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  updateDetails(title: string, author: string) {
    this.title = title
    this.author = author
    this.updatedAt = new Date()
  }
}

// src/domain/ports/repositories/BookRepository.ts
export interface BookRepository {
  findById(id: string): Promise<Book | null>
  findByIsbn(isbn: string): Promise<Book | null>
  findAll(): Promise<Book[]>
  save(book: Book): Promise<void>
  update(book: Book): Promise<void>
  delete(id: string): Promise<void>
}

// src/domain/ports/services/BookService.ts
export interface BookService {
  createBook(data: CreateBookDTO): Promise<Book>
  updateBook(id: string, data: UpdateBookDTO): Promise<Book>
  deleteBook(id: string): Promise<void>
  getBookById(id: string): Promise<Book | null>
  getAllBooks(): Promise<Book[]>
}

// src/domain/dtos/BookDTO.ts
export interface CreateBookDTO {
  title: string
  author: string
  isbn: string
  publishedAt: Date
}

export interface UpdateBookDTO {
  title?: string
  author?: string
}
```

### 2. Application Layer

Implement the service that coordinates the domain logic:

```typescript
// src/application/services/BookService.ts
import { inject, injectable } from 'inversify'
import { v4 as uuid } from 'uuid'
import { Book, BookEntity } from '@domain/models/Book'
import { BookRepository } from '@domain/ports/repositories/BookRepository'
import { BookService } from '@domain/ports/services/BookService'
import { CreateBookDTO, UpdateBookDTO } from '@domain/dtos/BookDTO'
import { TYPES } from '@infrastructure/config/types'
import { Logger } from '@infrastructure/config/logger'
import { BookNotFoundError } from '@domain/errors/BookErrors'

@injectable()
export class BookServiceImpl implements BookService {
  constructor(
    @inject(TYPES.BookRepository) private bookRepository: BookRepository,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async createBook(data: CreateBookDTO): Promise<Book> {
    try {
      // Check if book with ISBN already exists
      const existingBook = await this.bookRepository.findByIsbn(data.isbn)
      if (existingBook) {
        throw new Error('Book with this ISBN already exists')
      }

      const book = new BookEntity({
        id: uuid(),
        title: data.title,
        author: data.author,
        isbn: data.isbn,
        publishedAt: data.publishedAt,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      await this.bookRepository.save(book)
      this.logger.info('Book created successfully', { bookId: book.id })

      return book
    } catch (error) {
      this.logger.error('Error creating book', { error, data })
      throw error
    }
  }

  async updateBook(id: string, data: UpdateBookDTO): Promise<Book> {
    const book = await this.bookRepository.findById(id)
    if (!book) {
      throw new BookNotFoundError(id)
    }

    const bookEntity = new BookEntity(book)
    bookEntity.updateDetails(data.title || book.title, data.author || book.author)

    await this.bookRepository.update(bookEntity)
    this.logger.info('Book updated successfully', { bookId: id })

    return bookEntity
  }

  async deleteBook(id: string): Promise<void> {
    const exists = await this.bookRepository.findById(id)
    if (!exists) {
      throw new BookNotFoundError(id)
    }

    await this.bookRepository.delete(id)
    this.logger.info('Book deleted successfully', { bookId: id })
  }

  async getBookById(id: string): Promise<Book | null> {
    return this.bookRepository.findById(id)
  }

  async getAllBooks(): Promise<Book[]> {
    return this.bookRepository.findAll()
  }
}
```

### 3. Infrastructure Layer

#### 3.1 Prisma Schema

Add the Book model to your Prisma schema:

```prisma
// prisma/schema.prisma
model Book {
  id          String   @id @default(uuid())
  title       String
  author      String
  isbn        String   @unique
  publishedAt DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### 3.2 Repository Implementation

```typescript
// src/infrastructure/repositories/prisma/PrismaBookRepository.ts
import { inject, injectable } from 'inversify'
import { PrismaClient } from '@prisma/client'
import { Book, BookEntity } from '@domain/models/Book'
import { BookRepository } from '@domain/ports/repositories/BookRepository'
import { TYPES } from '@infrastructure/config/types'
import { Logger } from '@infrastructure/config/logger'

@injectable()
export class PrismaBookRepository implements BookRepository {
  private prisma: PrismaClient

  constructor(@inject(TYPES.Logger) private logger: Logger) {
    this.prisma = new PrismaClient()
  }

  async findById(id: string): Promise<Book | null> {
    try {
      const book = await this.prisma.book.findUnique({
        where: { id }
      })

      return book ? this.mapToBook(book) : null
    } catch (error) {
      this.logger.error('Error finding book by ID', { error, bookId: id })
      throw error
    }
  }

  async findByIsbn(isbn: string): Promise<Book | null> {
    try {
      const book = await this.prisma.book.findUnique({
        where: { isbn }
      })

      return book ? this.mapToBook(book) : null
    } catch (error) {
      this.logger.error('Error finding book by ISBN', { error, isbn })
      throw error
    }
  }

  async findAll(): Promise<Book[]> {
    try {
      const books = await this.prisma.book.findMany()
      return books.map(book => this.mapToBook(book))
    } catch (error) {
      this.logger.error('Error finding all books', { error })
      throw error
    }
  }

  async save(book: Book): Promise<void> {
    try {
      await this.prisma.book.create({
        data: {
          id: book.id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          publishedAt: book.publishedAt,
          createdAt: book.createdAt,
          updatedAt: book.updatedAt
        }
      })
    } catch (error) {
      this.logger.error('Error saving book', { error, bookId: book.id })
      throw error
    }
  }

  async update(book: Book): Promise<void> {
    try {
      await this.prisma.book.update({
        where: { id: book.id },
        data: {
          title: book.title,
          author: book.author,
          updatedAt: book.updatedAt
        }
      })
    } catch (error) {
      this.logger.error('Error updating book', { error, bookId: book.id })
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.book.delete({
        where: { id }
      })
    } catch (error) {
      this.logger.error('Error deleting book', { error, bookId: id })
      throw error
    }
  }

  private mapToBook(prismaBook: any): Book {
    return new BookEntity({
      id: prismaBook.id,
      title: prismaBook.title,
      author: prismaBook.author,
      isbn: prismaBook.isbn,
      publishedAt: prismaBook.publishedAt,
      createdAt: prismaBook.createdAt,
      updatedAt: prismaBook.updatedAt
    })
  }
}
```

### 4. API Layer

```typescript
// src/infrastructure/http/controllers/BookController.ts
import { inject } from 'inversify'
import { controller, httpGet, httpPost, httpPut, httpDelete } from 'inversify-express-utils'
import { Request, Response } from 'express'
import { BookService } from '@domain/ports/services/BookService'
import { TYPES } from '@infrastructure/config/types'
import {
  validateCreateBook,
  validateUpdateBook
} from '@infrastructure/http/validators/BookValidators'

@controller('/api/books')
export class BookController {
  constructor(@inject(TYPES.BookService) private bookService: BookService) {}

  @httpGet('/')
  async getBooks(req: Request, res: Response) {
    const books = await this.bookService.getAllBooks()
    return res.json(books)
  }

  @httpGet('/:id')
  async getBook(req: Request, res: Response) {
    const book = await this.bookService.getBookById(req.params.id)
    if (!book) {
      return res.status(404).json({ message: 'Book not found' })
    }
    return res.json(book)
  }

  @httpPost('/')
  async createBook(req: Request, res: Response) {
    const validationResult = validateCreateBook(req.body)
    if (!validationResult.success) {
      return res.status(400).json({ errors: validationResult.errors })
    }

    const book = await this.bookService.createBook(req.body)
    return res.status(201).json(book)
  }

  @httpPut('/:id')
  async updateBook(req: Request, res: Response) {
    const validationResult = validateUpdateBook(req.body)
    if (!validationResult.success) {
      return res.status(400).json({ errors: validationResult.errors })
    }

    try {
      const book = await this.bookService.updateBook(req.params.id, req.body)
      return res.json(book)
    } catch (error) {
      if (error instanceof BookNotFoundError) {
        return res.status(404).json({ message: error.message })
      }
      throw error
    }
  }

  @httpDelete('/:id')
  async deleteBook(req: Request, res: Response) {
    try {
      await this.bookService.deleteBook(req.params.id)
      return res.status(204).send()
    } catch (error) {
      if (error instanceof BookNotFoundError) {
        return res.status(404).json({ message: error.message })
      }
      throw error
    }
  }
}
```

### 5. Validation

```typescript
// src/infrastructure/http/validators/BookValidators.ts
import { z } from 'zod'

const createBookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  isbn: z.string().regex(/^[\d-]{10,17}$/, 'Invalid ISBN format'),
  publishedAt: z.string().datetime()
})

const updateBookSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().min(1).optional()
})

export const validateCreateBook = (data: unknown) => {
  return createBookSchema.safeParse(data)
}

export const validateUpdateBook = (data: unknown) => {
  return updateBookSchema.safeParse(data)
}
```

### 6. Error Handling

```typescript
// src/domain/errors/BookErrors.ts
export class BookNotFoundError extends Error {
  constructor(bookId: string) {
    super(`Book with ID ${bookId} not found`)
    this.name = 'BookNotFoundError'
  }
}

export class DuplicateISBNError extends Error {
  constructor(isbn: string) {
    super(`Book with ISBN ${isbn} already exists`)
    this.name = 'DuplicateISBNError'
  }
}
```

### 7. Dependency Injection Setup

```typescript
// src/infrastructure/config/types.ts
export const TYPES = {
  // ... existing types
  BookRepository: Symbol.for('BookRepository'),
  BookService: Symbol.for('BookService')
}

// src/infrastructure/config/inversify.config.ts
import { BookRepository } from '@domain/ports/repositories/BookRepository'
import { BookService } from '@domain/ports/services/BookService'
import { PrismaBookRepository } from '@infrastructure/repositories/prisma/PrismaBookRepository'
import { BookServiceImpl } from '@application/services/BookService'

container.bind<BookRepository>(TYPES.BookRepository).to(PrismaBookRepository).inSingletonScope()
container.bind<BookService>(TYPES.BookService).to(BookServiceImpl).inSingletonScope()
```

### 8. Testing

```typescript
// test/integration/BookService.test.ts
import { container } from '@infrastructure/config/inversify.config'
import { BookService } from '@domain/ports/services/BookService'
import { TYPES } from '@infrastructure/config/types'
import { cleanDatabase } from '../utils/prisma'

describe('BookService Integration Tests', () => {
  let bookService: BookService

  beforeEach(async () => {
    await cleanDatabase()
    bookService = container.get<BookService>(TYPES.BookService)
  })

  it('should create a new book', async () => {
    const bookData = {
      title: 'Test Book',
      author: 'Test Author',
      isbn: '978-3-16-148410-0',
      publishedAt: new Date()
    }

    const book = await bookService.createBook(bookData)

    expect(book).toBeDefined()
    expect(book.title).toBe(bookData.title)
    expect(book.author).toBe(bookData.author)
    expect(book.isbn).toBe(bookData.isbn)
  })

  it('should not create a book with duplicate ISBN', async () => {
    const bookData = {
      title: 'Test Book',
      author: 'Test Author',
      isbn: '978-3-16-148410-0',
      publishedAt: new Date()
    }

    await bookService.createBook(bookData)

    await expect(bookService.createBook(bookData)).rejects.toThrow(
      'Book with this ISBN already exists'
    )
  })
})

// test/unit/BookService.test.ts
import { Mock } from 'jest-mock'
import { BookServiceImpl } from '@application/services/BookService'
import { BookRepository } from '@domain/ports/repositories/BookRepository'
import { Logger } from '@infrastructure/config/logger'

describe('BookService Unit Tests', () => {
  let bookService: BookServiceImpl
  let mockBookRepository: Mock<BookRepository>
  let mockLogger: Mock<Logger>

  beforeEach(() => {
    mockBookRepository = {
      findById: jest.fn(),
      findByIsbn: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn()
    }

    bookService = new BookServiceImpl(mockBookRepository, mockLogger)
  })

  it('should create a book', async () => {
    const bookData = {
      title: 'Test Book',
      author: 'Test Author',
      isbn: '978-3-16-148410-0',
      publishedAt: new Date()
    }

    mockBookRepository.findByIsbn.mockResolvedValue(null)
    mockBookRepository.save.mockResolvedValue(undefined)

    const book = await bookService.createBook(bookData)

    expect(book).toBeDefined()
    expect(book.title).toBe(bookData.title)
    expect(mockBookRepository.save).toHaveBeenCalled()
  })
})
```

This example demonstrates:

1. **Domain Layer**: Entities, interfaces, and business rules
2. **Application Layer**: Service implementation with business logic
3. **Infrastructure Layer**: Prisma repository implementation
4. **API Layer**: Express controller with validation
5. **Error Handling**: Custom domain errors
6. **Dependency Injection**: Proper setup and configuration
7. **Testing**: Both unit and integration tests
8. **Validation**: Request validation using Zod

To use this new domain:

1. Run Prisma migration:

```bash
pnpm prisma migrate dev --name add_books
```

2. Update your API documentation:

```typescript
/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: Get all books
 *     tags: [Books]
 *     responses:
 *       200:
 *         description: List of books
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 */
```

3. Test your endpoints:

```bash
curl http://localhost:3000/api/books
```
