import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { injectable } from 'inversify';
import { Logger } from './logger';
import { inject } from 'inversify';
import { TYPES } from './types';

@injectable()
export class SwaggerConfig {
  constructor(@inject(TYPES.Logger) private logger: Logger) {}

  public setup(app: Express): void {
    const options = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'Express Hexagonal API',
          version: '1.0.0',
          description: 'RESTful API built with Express.js, TypeScript, and Hexagonal Architecture',
          license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT',
          },
          contact: {
            name: 'API Support',
            email: 'support@example.com',
          },
        },
        servers: [
          {
            url: '/',
            description: 'Development server',
          },
        ],
        components: {
          schemas: {
            User: {
              type: 'object',
              required: ['id', 'name', 'email', 'createdAt', 'updatedAt'],
              properties: {
                id: {
                  type: 'string',
                  description: 'The auto-generated unique identifier',
                  example: '123e4567-e89b-12d3-a456-426614174000'
                },
                name: {
                  type: 'string',
                  description: 'The user name',
                  example: 'John Doe'
                },
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'The user email address',
                  example: 'john.doe@example.com'
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  description: 'The date-time when the user was created'
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time',
                  description: 'The date-time when the user was last updated'
                }
              }
            },
            CreateUserRequest: {
              type: 'object',
              required: ['name', 'email'],
              properties: {
                name: {
                  type: 'string',
                  description: 'The user name',
                  example: 'John Doe'
                },
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'The user email address',
                  example: 'john.doe@example.com'
                }
              }
            },
            UpdateUserRequest: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'The user name',
                  example: 'John Smith'
                },
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'The user email address',
                  example: 'john.smith@example.com'
                }
              }
            },
            Error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string'
                }
              }
            }
          }
        }
      },
      apis: ['./src/infrastructure/controllers/**/*.ts'], // Path to the files containing Swagger annotations
    };

    const specs = swaggerJsdoc(options);
    
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
      explorer: true, 
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'API Documentation | Express Hexagonal Boilerplate'
    }));
    
    this.logger.info('Swagger documentation initialized', { url: '/api-docs' });
  }
}
