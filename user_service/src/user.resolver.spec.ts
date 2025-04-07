import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository, In } from 'typeorm';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { Role } from '@guards/roles_guard/role.enum';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

import { ObjectLiteral } from 'typeorm';

type MockRepository<T extends ObjectLiteral = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T extends ObjectLiteral = any>(): MockRepository<T> => ({
  find: jest.fn(),
  findOneBy: jest.fn(),
  findBy: jest.fn().mockResolvedValue([]),
  save: jest.fn(),
  delete: jest.fn(),
});

describe('UserService', () => {
  let service: UserService;
  let usersRepository: MockRepository<User>;

  beforeEach(async () => {
    process.env.SALT = '10';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useFactory: createMockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    usersRepository = module.get<MockRepository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const createUserInput: CreateUserInput = {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        role: Role.STUDENT,
        pseudo: 'John Doe',
      };

      const expectedUser = {
        id: 'user-id-1',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
        password: 'hashed-password',
        pseudo: 'John Doe',
        role: Role.STUDENT,
      };

      usersRepository.findOneBy?.mockResolvedValueOnce(null);
      usersRepository.save?.mockResolvedValueOnce(expectedUser);

      const result = await service.create(createUserInput);

      expect(usersRepository.findOneBy).toHaveBeenCalledWith({ email: createUserInput.email });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserInput.password, 10);
      expect(usersRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        firstname: createUserInput.firstname,
        lastname: createUserInput.lastname,
        email: createUserInput.email,
        pseudo: createUserInput.pseudo,
        role: createUserInput.role,
      }));
      expect(result).toEqual(expectedUser);
    });

    it('should throw BadRequestException if user already exists', async () => {
      const createUserInput: CreateUserInput = {
        firstname: 'John',
        lastname: 'Doe',
        email: 'existing@example.com',
        password: 'password123',
        role: Role.STUDENT,
        pseudo: 'John Doe',
      };

      const existingUser = {
        id: 'existing-id',
        email: 'existing@example.com',
      };

      usersRepository.findOneBy?.mockResolvedValueOnce(existingUser);

      await expect(service.create(createUserInput)).rejects.toThrow(BadRequestException);
      expect(usersRepository.findOneBy).toHaveBeenCalledWith({ email: createUserInput.email });
      expect(usersRepository.save).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on error', async () => {
      const createUserInput: CreateUserInput = {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        role: Role.STUDENT,
        pseudo: 'John Doe',
      };

      usersRepository.findOneBy?.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.create(createUserInput)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const expectedUsers = [
        { id: '1', firstname: 'John', lastname: 'Doe' },
        { id: '2', firstname: 'Jane', lastname: 'Smith' },
      ];

      usersRepository.find?.mockResolvedValueOnce(expectedUsers);

      const result = await service.findAll();

      expect(usersRepository.find).toHaveBeenCalled();
      expect(result).toEqual(expectedUsers);
    });

    it('should return null if no users found', async () => {
      usersRepository.find?.mockResolvedValueOnce(null);

      const result = await service.findAll();

      expect(result).toBeNull();
    });

    it('should throw InternalServerErrorException on error', async () => {
      usersRepository.find?.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.findAll()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findOneById', () => {
    it('should find a user by ID', async () => {
      const userId = 'user-id-1';
      const expectedUser = { id: userId, firstname: 'John', lastname: 'Doe' };

      usersRepository.findOneBy?.mockResolvedValueOnce(expectedUser);

      const result = await service.findOneById(userId);

      expect(usersRepository.findOneBy).toHaveBeenCalledWith({ id: userId });
      expect(result).toEqual(expectedUser);
    });

    it('should return null if user not found', async () => {
      const userId = 'non-existent-id';

      usersRepository.findOneBy?.mockResolvedValueOnce(null);

      const result = await service.findOneById(userId);

      expect(result).toBeNull();
    });

    it('should throw InternalServerErrorException on error', async () => {
      const userId = 'user-id-1';

      usersRepository.findOneBy?.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.findOneById(userId)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findUsersByIds', () => {
    it('should find users by IDs', async () => {
      const userIds = ['id-1', 'id-2'];
      const expectedUsers = [
        { id: 'id-1', firstname: 'John' },
        { id: 'id-2', firstname: 'Jane' },
      ];

      usersRepository.findBy?.mockResolvedValueOnce(expectedUsers);

      const result = await service.findUsersByIds(userIds);

      expect(usersRepository.findBy).toHaveBeenCalledWith({ id: In(userIds) });
      expect(result).toEqual(expectedUsers);
    });

    it('should throw InternalServerErrorException on error', async () => {
      const userIds = ['id-1', 'id-2'];

      usersRepository.findBy?.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.findUsersByIds(userIds)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findOneByEmail', () => {
    it('should find a user by email', async () => {
      const email = 'john.doe@example.com';
      const expectedUser = { id: 'user-id-1', email, firstname: 'John' };

      usersRepository.findOneBy?.mockResolvedValueOnce(expectedUser);

      const result = await service.findOneByEmail(email);

      expect(usersRepository.findOneBy).toHaveBeenCalledWith({ email });
      expect(result).toEqual(expectedUser);
    });

    it('should return null if user not found', async () => {
      const email = 'nonexistent@example.com';

      usersRepository.findOneBy?.mockResolvedValueOnce(null);

      const result = await service.findOneByEmail(email);

      expect(result).toBeNull();
    });

    it('should throw InternalServerErrorException on error', async () => {
      const email = 'john.doe@example.com';

      usersRepository.findOneBy?.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.findOneByEmail(email)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      const userId = 'user-id-1';
      const updateUserInput: UpdateUserInput = {
        id: userId,
        firstname: 'John',
        lastname: 'Updated',
      };

      const existingUser = {
        id: userId,
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
      };

      const updatedUser = {
        ...existingUser,
        ...updateUserInput,
      };

      usersRepository.findOneBy?.mockResolvedValueOnce(existingUser);
      usersRepository.save?.mockResolvedValueOnce(updatedUser);

      const result = await service.update(updateUserInput);

      expect(usersRepository.findOneBy).toHaveBeenCalledWith({ id: userId });
      expect(usersRepository.save).toHaveBeenCalledWith(updatedUser);
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      const updateUserInput: UpdateUserInput = {
        id: 'non-existent-id',
        firstname: 'John',
      };

      usersRepository.findOneBy?.mockResolvedValueOnce(null);

      await expect(service.update(updateUserInput)).rejects.toThrow(NotFoundException);
      expect(usersRepository.save).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on error', async () => {
      const updateUserInput: UpdateUserInput = {
        id: 'user-id-1',
        firstname: 'John',
      };

      usersRepository.findOneBy?.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.update(updateUserInput)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('remove', () => {
    it('should remove a user successfully', async () => {
      const userId = 'user-id-1';
      const existingUser = { id: userId, firstname: 'John' };
      const deleteResult = { affected: 1 };

      usersRepository.findOneBy?.mockResolvedValueOnce(existingUser);
      usersRepository.delete?.mockResolvedValueOnce(deleteResult);

      const result = await service.remove(userId);

      expect(usersRepository.findOneBy).toHaveBeenCalledWith({ id: userId });
      expect(usersRepository.delete).toHaveBeenCalledWith({ id: userId });
      expect(result).toEqual(deleteResult);
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'non-existent-id';

      usersRepository.findOneBy?.mockResolvedValueOnce(null);

      await expect(service.remove(userId)).rejects.toThrow(NotFoundException);
      expect(usersRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on error', async () => {
      const userId = 'user-id-1';

      usersRepository.findOneBy?.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.remove(userId)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('validateUser', () => {
    it('should validate user credentials successfully', async () => {
      const email = 'john.doe@example.com';
      const password = 'password123';
      const existingUser = {
        id: 'user-id-1',
        email,
        password: 'hashed-password',
      };

      usersRepository.findOneBy?.mockResolvedValueOnce(existingUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.validateUser(email, password);

      expect(usersRepository.findOneBy).toHaveBeenCalledWith({ email });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, existingUser.password);
      expect(result).toEqual(existingUser);
    });

    it('should return null if user not found', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password123';

      usersRepository.findOneBy?.mockResolvedValueOnce(null);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return null if password is invalid', async () => {
      const email = 'john.doe@example.com';
      const password = 'wrong-password';
      const existingUser = {
        id: 'user-id-1',
        email,
        password: 'hashed-password',
      };

      usersRepository.findOneBy?.mockResolvedValueOnce(existingUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });

    it('should throw InternalServerErrorException on error', async () => {
      const email = 'john.doe@example.com';
      const password = 'password123';

      usersRepository.findOneBy?.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.validateUser(email, password)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('changeUserRole', () => {
    it('should change user role successfully', async () => {
      const userId = 'user-id-1';
      const newRole = Role.PROFESSOR;

      const existingUser = {
        id: userId,
        firstname: 'John',
        role: Role.STUDENT,
      };

      const updatedUser = {
        ...existingUser,
        role: newRole,
      };

      usersRepository.findOneBy?.mockResolvedValueOnce(existingUser);
      usersRepository.save?.mockResolvedValueOnce(updatedUser);

      const result = await service.changeUserRole(userId, newRole);

      expect(usersRepository.findOneBy).toHaveBeenCalledWith({ id: userId });
      expect(usersRepository.save).toHaveBeenCalledWith({
        ...existingUser,
        role: newRole,
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'non-existent-id';
      const newRole = Role.PROFESSOR;

      usersRepository.findOneBy?.mockResolvedValueOnce(null);

      await expect(service.changeUserRole(userId, newRole)).rejects.toThrow(NotFoundException);
      expect(usersRepository.save).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on error', async () => {
      const userId = 'user-id-1';
      const newRole = Role.PROFESSOR;

      usersRepository.findOneBy?.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.changeUserRole(userId, newRole)).rejects.toThrow(InternalServerErrorException);
    });
  });
});