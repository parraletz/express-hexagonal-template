import { User } from '@domain/models/User'

export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findAll(): Promise<User[]>
  save(user: User): Promise<void>
  update(user: User): Promise<void>
  delete(id: string): Promise<void>
}
