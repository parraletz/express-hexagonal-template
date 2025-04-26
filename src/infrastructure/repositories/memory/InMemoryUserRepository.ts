import { injectable } from 'inversify';
import { User, UserEntity } from '@domain/models/User';
import { UserRepository } from '@domain/ports/repositories/UserRepository';

@injectable()
export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [
    new UserEntity({
      name: 'John Doe',
      email: 'john@example.com'
    }),
    new UserEntity({
      name: 'Jane Smith',
      email: 'jane@example.com'
    })
  ];

  async findById(id: string): Promise<User | null> {
    const user = this.users.find(user => user.id === id);
    return user || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = this.users.find(user => user.email === email);
    return user || null;
  }

  async findAll(): Promise<User[]> {
    return [...this.users];
  }

  async save(user: User): Promise<void> {
    this.users.push(user);
  }

  async update(updatedUser: User): Promise<void> {
    const index = this.users.findIndex(user => user.id === updatedUser.id);
    
    if (index !== -1) {
      this.users[index] = updatedUser;
    }
  }

  async delete(id: string): Promise<void> {
    this.users = this.users.filter(user => user.id !== id);
  }
}
