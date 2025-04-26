import { Request, Response } from 'express';
import { controller, httpGet, httpPost, httpPut, httpDelete, request, response } from 'inversify-express-utils';
import { inject } from 'inversify';
import { TYPES } from '@infrastructure/config/types';
import { Logger } from '@infrastructure/config/logger';
import { UserService } from '@domain/ports/services/UserService';

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */
@controller('/api/users')
export class UserController {
  constructor(
    @inject(TYPES.UserService) private userService: UserService,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  /**
   * @swagger
   * /api/users:
   *   get:
   *     summary: Get all users
   *     description: Retrieve a list of all users
   *     tags: [Users]
   *     responses:
   *       200:
   *         description: A list of users
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/User'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  @httpGet('/')
  async getAllUsers(@request() req: Request, @response() res: Response) {
    try {
      this.logger.info('Getting all users', { path: req.path });
      
      const users = await this.userService.getAllUsers();
      
      return res.status(200).json(users);
    } catch (error) {
      this.logger.error('Error fetching all users', { error, path: req.path });
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * @swagger
   * /api/users/{id}:
   *   get:
   *     summary: Get a user by ID
   *     description: Retrieve a single user by their ID
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The user ID
   *     responses:
   *       200:
   *         description: User found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  @httpGet('/:id')
  async getUserById(@request() req: Request, @response() res: Response) {
    try {
      const { id } = req.params;
      
      this.logger.info('Getting user by ID', { userId: id });
      
      const user = await this.userService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      return res.status(200).json(user);
    } catch (error) {
      this.logger.error('Error fetching user by ID', { error, userId: req.params.id });
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * @swagger
   * /api/users:
   *   post:
   *     summary: Create a new user
   *     description: Create a new user record
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateUserRequest'
   *     responses:
   *       201:
   *         description: User created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       400:
   *         description: Invalid input
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       409:
   *         description: User with this email already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  @httpPost('/')
  async createUser(@request() req: Request, @response() res: Response) {
    try {
      const { name, email } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
      }
      
      this.logger.info('Creating new user', { email });
      
      const user = await this.userService.createUser({ name, email });
      
      return res.status(201).json(user);
    } catch (error) {
      if (error instanceof Error && error.message === 'User with this email already exists') {
        return res.status(409).json({ message: error.message });
      }
      
      this.logger.error('Error creating user', { error, email: req.body.email });
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * @swagger
   * /api/users/{id}:
   *   put:
   *     summary: Update a user
   *     description: Update an existing user record
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The user ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateUserRequest'
   *     responses:
   *       200:
   *         description: User updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       400:
   *         description: Invalid input
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       409:
   *         description: Email is already taken
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  @httpPut('/:id')
  async updateUser(@request() req: Request, @response() res: Response) {
    try {
      const { id } = req.params;
      const { name, email } = req.body;
      
      if (!name && !email) {
        return res.status(400).json({ message: 'At least one field (name or email) is required' });
      }
      
      this.logger.info('Updating user', { userId: id });
      
      const updatedUser = await this.userService.updateUser(id, { name, email });
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      return res.status(200).json(updatedUser);
    } catch (error) {
      if (error instanceof Error && error.message === 'Email is already taken') {
        return res.status(409).json({ message: error.message });
      }
      
      this.logger.error('Error updating user', { error, userId: req.params.id });
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * @swagger
   * /api/users/{id}:
   *   delete:
   *     summary: Delete a user
   *     description: Delete a user by their ID
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The user ID
   *     responses:
   *       204:
   *         description: User deleted successfully
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  @httpDelete('/:id')
  async deleteUser(@request() req: Request, @response() res: Response) {
    try {
      const { id } = req.params;
      
      this.logger.info('Deleting user', { userId: id });
      
      const deleted = await this.userService.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      return res.status(204).send();
    } catch (error) {
      this.logger.error('Error deleting user', { error, userId: req.params.id });
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}
