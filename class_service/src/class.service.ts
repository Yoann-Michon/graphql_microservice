import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateClassInput } from './dto/create-class.input';
import { Repository } from 'typeorm';
import { UpdateClassInput } from './dto/update-class.input';
import { Class } from './entities/class.entity';

@Injectable()
export class ClassService {
  constructor(@InjectRepository(Class) private readonly classRepository: Repository<Class>,
  ) { }
  
  async create(createClassInput: CreateClassInput) {
    const { professorId, studentIds, name } = createClassInput;
    const allUserIds = [professorId, ...studentIds];
    const usersExistence = await this.fetchUsersByIds(allUserIds);

    if (!usersExistence[professorId]) {
      throw new NotFoundException(`Professor with ID ${professorId} not found`);
    }

    const missingStudents = studentIds.filter(id => !usersExistence[id]);
    if (missingStudents.length > 0) {
      throw new NotFoundException(`Students not found: ${missingStudents.join(', ')}`);
    }

    const newClass = new Class();
    newClass.name=name;
    newClass.professorId=professorId;
    newClass.studentIds=studentIds;

    return this.classRepository.save(newClass);
  }

  async findAll() {
    try {
      return await this.classRepository.find();
    } catch (error) {
      throw new InternalServerErrorException(`Error retrieving classes: ${error.message}`);
    }
  }

  async findOne(id: string) {
    try {
      return await this.classRepository.findOneBy({ id }) || null;
    } catch (error) {
      throw new InternalServerErrorException(`Error retrieving class by ID: ${error.message}`);
    }
  }

  async update(updateClassInput: UpdateClassInput) {
    try {
      const existingClass = await this.findOne(updateClassInput.id);
      if (! existingClass) {
        throw new NotFoundException('Class not found');
      }
      const updatedUser = {
        ... existingClass,
        ...updateClassInput
      };
      return await this.classRepository.save(updatedUser);
    } catch (error) {
      throw new InternalServerErrorException(`Error updating class: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      const existingClass = await this.findOne(id);
      if (!existingClass) {
        throw new NotFoundException('Class not found');
      }
      return await this.classRepository.delete({ id });
    } catch (error) {
      throw new InternalServerErrorException(`Error deleting class: ${error.message}`);
    }
  }

  private async fetchUsersByIds(ids: string[]): Promise<Record<string, boolean>> {
    const query = `
      query ($ids: [String!]!) {
        findUsersByIds(ids: $ids) {
          id
        }
      }
    `;

    const response = await fetch(process.env.USER_SERVICE_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.API_KEY_ACTIVE! || process.env.API_KEY_OLD!,
      },
      body: JSON.stringify({
        query,
        variables: { ids },
      }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException(`Error fetching users: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.errors) {
      throw new InternalServerErrorException(`GraphQL error: ${JSON.stringify(data.errors)}`);
    }

    const existingUserIds = new Set(data.data.findUsersByIds.map((user: { id: string }) => user.id));
    return ids.reduce((acc, id) => {
      acc[id] = existingUserIds.has(id);
      return acc;
    }, {} as Record<string, boolean>);
  }
}
