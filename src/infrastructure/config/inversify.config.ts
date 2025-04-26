import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';

// Infrastructure
import { Logger } from './logger';
import { App } from './app';
import { SwaggerConfig } from './swagger';

// Domain & Application
import { UserRepository } from '@domain/ports/repositories/UserRepository';
import { UserService } from '@domain/ports/services/UserService';
import { UserServiceImpl } from '@application/services/UserServiceImpl';

// Repositories
import { InMemoryUserRepository } from '@infrastructure/repositories/memory/InMemoryUserRepository';

// Controllers - Important to import these so they are registered
import '@infrastructure/controllers/api/HomeController';
import '@infrastructure/controllers/api/UserController';

// Create and configure container
const container = new Container();

// Infrastructure
container.bind<Logger>(TYPES.Logger).to(Logger).inSingletonScope();
container.bind<App>(TYPES.App).to(App).inSingletonScope();
container.bind<SwaggerConfig>(TYPES.SwaggerConfig).to(SwaggerConfig).inSingletonScope();

// Repositories
container.bind<UserRepository>(TYPES.UserRepository).to(InMemoryUserRepository).inSingletonScope();

// Services
container.bind<UserService>(TYPES.UserService).to(UserServiceImpl).inSingletonScope();

export { container };
