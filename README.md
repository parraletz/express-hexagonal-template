# Express Hexagonal Architecture Boilerplate

A production-ready Express.js boilerplate with TypeScript implementing Hexagonal (Ports & Adapters) Architecture.

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
