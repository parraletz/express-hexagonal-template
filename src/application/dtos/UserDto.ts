import { CreateUserDTO, UpdateUserDTO } from '@domain/ports/services/UserService'
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateUserDto implements CreateUserDTO {
  @IsString()
  name: string

  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  password: string

  constructor(name: string, email: string, password: string) {
    this.name = name
    this.email = email
    this.password = password
  }
}

export class UpdateUserDto implements UpdateUserDTO {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string
}

export class UserResponseDto {
  id: string
  name: string
  email: string
  createdAt: Date
  updatedAt: Date

  constructor(id: string, name: string, email: string, createdAt: Date, updatedAt: Date) {
    this.id = id
    this.name = name
    this.email = email
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}
