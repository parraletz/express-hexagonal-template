import { Application } from 'express'
import request from 'supertest'
import { App } from '../src/infrastructure/config/app'
import { container } from '../src/infrastructure/config/inversify.config'
import { TYPES } from '../src/infrastructure/config/types'

describe('UserController', () => {
  let expressApp: Application
  let createUserId: string

  beforeAll(() => {
    const appInstance = container.get<App>(TYPES.App)
    expressApp = appInstance.setup(container)
  })

  it('should respond with 200 for GET /api/users', async () => {
    const response = await request(expressApp).get('/api/users').send()
    expect(response.status).toBe(200)
  })

  // Create a new user
  it('should respond with 201 for POST /api/users', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123'
    }

    const response = await request(expressApp).post('/api/users').send(userData)
    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty('id')
    expect(response.body.name).toBe(userData.name)
    expect(response.body.email).toBe(userData.email)

    createUserId = response.body.id
  })

  // Get a user by ID
  it('should respond with 200 for GET /api/users/:id', async () => {
    expect(createUserId).toBeDefined()

    const response = await request(expressApp).get(`/api/users/${createUserId}`).send()

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('id')
    expect(response.body.id).toBe(createUserId)
    expect(response.body).toHaveProperty('name')
    expect(response.body).toHaveProperty('email')
  })

  // Update a user by ID
  it('should respond with 200 for PUT /api/users/:id', async () => {
    expect(createUserId).toBeDefined()
    const updatedUserData = {
      name: 'Jane Doe',
      email: 'jane.doe@example.com'
    }
    const response = await request(expressApp)
      .put(`/api/users/${createUserId}`)
      .send(updatedUserData)
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('id')
    expect(response.body.id).toBe(createUserId)
    expect(response.body.name).toBe(updatedUserData.name)
    expect(response.body.email).toBe(updatedUserData.email)
  })

  // Delete a user by ID
  it('should respond with 204 for DELETE /api/users/:id', async () => {
    expect(createUserId).toBeDefined()
    const response = await request(expressApp).delete(`/api/users/${createUserId}`).send()
    expect(response.status).toBe(204)

    const getResponse = await request(expressApp).get(`/api/users/${createUserId}`).send()
    expect(getResponse.status).toBe(404)
  })
})
