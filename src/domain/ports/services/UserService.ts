import { User } from '@domain/models/User';

export interface CreateUserDTO {
  name: string;
  email: string;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
}

export interface UserService {
  createUser(userData: CreateUserDTO): Promise<User>;
  updateUser(id: string, userData: UpdateUserDTO): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<boolean>;
}
