import { User, UserEntity } from '@domain/models/User'
import { CacheService } from '@domain/ports/cache/CacheService'
import { UserRepository } from '@domain/ports/repositories/UserRepository'
import { CreateUserDTO, UpdateUserDTO, UserService } from '@domain/ports/services/UserService'
import { Logger } from '@infrastructure/config/logger'
import { TYPES } from '@infrastructure/config/types'
import { inject, injectable } from 'inversify'

@injectable()
export class UserServiceImpl implements UserService {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepository,
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.CacheService) private cacheService: CacheService
  ) {}

  async createUser(userData: CreateUserDTO): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(userData.email)

    if (existingUser) {
      this.logger.warn('Attempted to create user with existing email', { email: userData.email })
      throw new Error('User with this email already exists')
    }

    const user = new UserEntity({
      name: userData.name,
      email: userData.email
    })

    await this.userRepository.save(user)
    
    // Invalidate relevant cache entries
    this.cacheService.delete('users:all')
    
    this.logger.info('User created successfully', { userId: user.id })
    return user
  }

  async updateUser(id: string, userData: UpdateUserDTO): Promise<User | null> {
    const user = await this.userRepository.findById(id)

    if (!user) {
      this.logger.warn('Attempted to update non-existent user', { userId: id })
      return null
    }

    if (userData.email && userData.email !== user.email) {
      const existingUserWithEmail = await this.userRepository.findByEmail(userData.email)
      if (existingUserWithEmail) {
        this.logger.warn('Attempted to update user with existing email', { email: userData.email })
        throw new Error('Email is already taken')
      }
    }

    if (!(user instanceof UserEntity)) {
      const userEntity = new UserEntity({
        id: user.id,
        name: user.name,
        email: user.email
      })

      userEntity.createdAt = user.createdAt
      userEntity.updatedAt = user.updatedAt

      await this.userRepository.update(userEntity)

      userEntity.update(userData)
      await this.userRepository.update(userEntity)

      // Invalidate cache entries
      const cacheKey = `user:${id}`
      await this.cacheService.delete(cacheKey)
      if (userData.email) {
        await this.cacheService.delete(`user:email:${userData.email}`)
        await this.cacheService.delete(`user:email:${user.email}`)
      }
      await this.cacheService.delete('users:all')
      
      this.logger.info('User updated successfully', { userId: id })
      return userEntity
    }

    user.update(userData)
    await this.userRepository.update(user)

    // Invalidate cache entries
    const cacheKey = `user:${id}`
    await this.cacheService.delete(cacheKey)
    if (userData.email) {
      await this.cacheService.delete(`user:email:${userData.email}`)
      await this.cacheService.delete(`user:email:${user.email}`)
    }
    await this.cacheService.delete('users:all')
    
    this.logger.info('User updated successfully', { userId: id })
    return user
  }

  async getUserById(id: string): Promise<User | null> {
    // Try to get from cache first
    const cacheKey = `user:${id}`
    const cachedUser = await this.cacheService.get<User>(cacheKey)
    
    if (cachedUser) {
      this.logger.debug('User retrieved from cache', { userId: id })
      return cachedUser
    }
    
    // If not in cache, get from repository
    const user = await this.userRepository.findById(id)
    
    if (!user) {
      this.logger.debug('User not found by ID', { userId: id })
      return null
    }
    
    // Store in cache for future requests with 1 hour TTL
    await this.cacheService.set(cacheKey, user, 3600)
    
    return user
  }

  async getUserByEmail(email: string): Promise<User | null> {
    // Try to get from cache first
    const cacheKey = `user:email:${email}`
    const cachedUser = await this.cacheService.get<User>(cacheKey)
    
    if (cachedUser) {
      this.logger.debug('User retrieved from cache by email', { email })
      return cachedUser
    }
    
    // If not in cache, get from repository
    const user = await this.userRepository.findByEmail(email)
    
    if (!user) {
      this.logger.debug('User not found by email', { email })
      return null
    }
    
    // Store in cache for future requests with 1 hour TTL
    await this.cacheService.set(cacheKey, user, 3600)
    
    return user
  }

  async getAllUsers(): Promise<User[]> {
    // Try to get from cache first
    const cacheKey = 'users:all'
    const cachedUsers = await this.cacheService.get<User[]>(cacheKey)
    
    if (cachedUsers) {
      this.logger.debug('All users retrieved from cache', { count: cachedUsers.length })
      return cachedUsers
    }
    
    // If not in cache, get from repository
    const users = await this.userRepository.findAll()
    
    // Store in cache for future requests with 5 minutes TTL (shorter for collections)
    await this.cacheService.set(cacheKey, users, 300)
    
    this.logger.debug('Retrieved all users from repository', { count: users.length })
    return users
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = await this.userRepository.findById(id)

    if (!user) {
      this.logger.warn('Attempted to delete non-existent user', { userId: id })
      return false
    }

    await this.userRepository.delete(id)
    
    // Invalidate cache entries
    await this.cacheService.delete(`user:${id}`)
    await this.cacheService.delete(`user:email:${user.email}`)
    await this.cacheService.delete('users:all')
    
    this.logger.info('User deleted successfully', { userId: id })
    return true
  }
}
