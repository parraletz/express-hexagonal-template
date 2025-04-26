import { randomUUID } from 'crypto'

export interface User1 {
  id: string
  name: string
  email: string
  createdAt: Date
  updatedAt: Date
}

export class User {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly email: string,
    readonly createdAt: Date,
    readonly updatedAt: Date
  ) {
    this.id = id
    this.name = name
    this.email = email
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}

export class UserEntity implements User {
  id: string
  name: string
  email: string
  createdAt: Date
  updatedAt: Date

  constructor(props: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
    this.id = props.id || randomUUID()
    this.name = props.name
    this.email = props.email
    this.createdAt = new Date()
    this.updatedAt = new Date()
  }

  update(props: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>) {
    if (props.name) this.name = props.name
    if (props.email) this.email = props.email
    this.updatedAt = new Date()
  }
}
