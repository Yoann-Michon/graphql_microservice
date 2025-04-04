import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Role } from '@guards/roles_guard/role.enum';

@Injectable()
export class UserService {

  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) { }

  async create(createUserInput: CreateUserInput) {
    try {
      const user = await this.findOneByEmail(createUserInput.email);
      if (user) {
        throw new BadRequestException('User already exist');
      }
      const hashedPassword = await bcrypt.hash(createUserInput.password, Number(process.env.SALT));

      const newUser = new User();
      newUser.firstname = createUserInput.firstname;
      newUser.lastname = createUserInput.lastname;
      newUser.email = createUserInput.email;
      newUser.password = hashedPassword;

      return await this.usersRepository.save(newUser);
    } catch (error) {
      throw new InternalServerErrorException(`Error creating user: ${error.message}`);
    }
  }

  async findAll(): Promise<User[] | null> {
    try {
      return await this.usersRepository.find() || null;
    } catch (error) {
      throw new InternalServerErrorException(`Error retrieving users: ${error.message}`);
    }
  }

  async findOneById(id: string): Promise<User | null> {
    try {
      return await this.usersRepository.findOneBy({ id }) || null;
    } catch (error) {
      throw new InternalServerErrorException(`Error retrieving user by ID: ${error.message}`);
    }
  }

  async findUsersByIds(ids: string[]): Promise<User[]> {
    try {
      return await this.usersRepository.findBy({ id: In(ids) });
    } catch (error) {
      throw new InternalServerErrorException(`Error retrieving users by IDs: ${error.message}`);
    }
  }
  
  
  async findOneByEmail(email: string): Promise<User | null> {
    try {
      return await this.usersRepository.findOneBy({ email }) || null;
    } catch (error) {
      throw new InternalServerErrorException(`Error retrieving user by email: ${error.message}`);
    }
  }

  async update(updateUserInput: UpdateUserInput) {
    try {
      const user = await this.findOneById(updateUserInput.id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const updatedUser = {
        ...user,
        ...updateUserInput
      };
      return await this.usersRepository.save(updatedUser);
    } catch (error) {
      throw new InternalServerErrorException(`Error updating user: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      const user = await this.findOneById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return await this.usersRepository.delete({ id });
    } catch (error) {
      throw new InternalServerErrorException(`Error deleting user: ${error.message}`);
    }
  }

  async validateUser(updateUserInput: UpdateUserInput): Promise<User | null> {
    try {
      const user = await this.findOneByEmail(updateUserInput.email!);

      if (!user) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(updateUserInput.password!, user.password);

      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      throw new InternalServerErrorException(`Error validating user: ${error.message}`);
    }
  }
}
