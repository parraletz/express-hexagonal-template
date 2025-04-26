import { User, UserEntity } from '@domain/models/User'
import { UserRepository } from '@domain/ports/repositories/UserRepository'
import { CreateUserDTO, UpdateUserDTO, UserService } from '@domain/ports/services/UserService'
import { Logger } from '@infrastructure/config/logger'
import { TYPES } from '@infrastructure/config/types'
import { inject, injectable } from 'inversify'

@injectable()
export class UserServiceImpl implements UserService {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepository,
    @inject(TYPES.Logger) private logger: Logger
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

      this.logger.info('User updated successfully', { userId: id })
      return userEntity
    }

    user.update(userData)
    await this.userRepository.update(user)

    this.logger.info('User updated successfully', { userId: id })
    return user
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await this.userRepository.findById(id)

    if (!user) {
      this.logger.debug('User not found by ID', { userId: id })
    }

    return user
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email)

    if (!user) {
      this.logger.debug('User not found by email', { email })
    }

    return user
  }

  async getAllUsers(): Promise<User[]> {
    const users = await this.userRepository.findAll()
    this.logger.debug('Retrieved all users', { count: users.length })
    return users
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = await this.userRepository.findById(id)

    if (!user) {
      this.logger.warn('Attempted to delete non-existent user', { userId: id })
      return false
    }

    await this.userRepository.delete(id)
    this.logger.info('User deleted successfully', { userId: id })
    return true
  }
}
