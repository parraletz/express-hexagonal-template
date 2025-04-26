import { User } from '@domain/models/User'
import { UserRepository } from '@domain/ports/repositories/UserRepository'
import { promises as fs } from 'fs'
import { injectable } from 'inversify'
import path from 'path'

@injectable()
export class JsonUserRepository implements UserRepository {
  private readonly dataFilePath: string

  constructor() {
    this.dataFilePath = path.resolve(process.cwd(), 'data', 'users.json')
  }

  /**
   * Read all users from the JSON file
   */
  private async readUsersFile(): Promise<User[]> {
    try {
      const data = await fs.readFile(this.dataFilePath, 'utf8')
      return JSON.parse(data) as User[]
    } catch (error) {
      // If file doesn't exist or is empty, return empty array
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await this.writeUsersFile([])
        return []
      }
      throw error
    }
  }

  /**
   * Write users to the JSON file
   */
  private async writeUsersFile(users: User[]): Promise<void> {
    const dirPath = path.dirname(this.dataFilePath)

    try {
      // Ensure the directory exists
      await fs.mkdir(dirPath, { recursive: true })
      await fs.writeFile(this.dataFilePath, JSON.stringify(users, null, 2), 'utf8')
    } catch (error) {
      console.error('Error writing to users file:', error)
      throw error
    }
  }

  async findById(id: string): Promise<User | null> {
    const users = await this.readUsersFile()
    const user = users.find(user => user.id === id)
    return user || null
  }

  async findByEmail(email: string): Promise<User | null> {
    const users = await this.readUsersFile()
    const user = users.find(user => user.email === email)
    return user || null
  }

  async findAll(): Promise<User[]> {
    return this.readUsersFile()
  }

  async save(user: User): Promise<void> {
    const users = await this.readUsersFile()
    users.push(user)
    await this.writeUsersFile(users)
  }

  async update(updatedUser: User): Promise<void> {
    const users = await this.readUsersFile()
    const index = users.findIndex(user => user.id === updatedUser.id)

    if (index !== -1) {
      users[index] = updatedUser
      await this.writeUsersFile(users)
    }
  }

  async delete(id: string): Promise<void> {
    let users = await this.readUsersFile()
    users = users.filter(user => user.id !== id)
    await this.writeUsersFile(users)
  }
}
