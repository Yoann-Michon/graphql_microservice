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
    const newClass = new Class();
    newClass.name = name;
    newClass.professorId = professorId;
    newClass.studentIds = studentIds??[];

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
      if (!existingClass) {
        throw new NotFoundException('Class not found');
      }
      const updatedUser = {
        ...existingClass,
        ...updateClassInput
      };
      return await this.classRepository.save(updatedUser);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error updating class: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      const existingClass = await this.findOne(id);
  
      if (!existingClass) {
        throw new NotFoundException('Class not found');
      }
  
      if (existingClass.studentIds && existingClass.studentIds.length > 0) {
        throw new NotFoundException('Class cannot be deleted because it contains students');
      }
  
      return await this.classRepository.delete({ id });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error deleting class: ${error.message}`);
    }
  }


  async addStudentsToClass(classId: string, studentIds: string[]): Promise<Class> {
    try {
      const existingClass = await this.findOne(classId);
      if (!existingClass) {
        throw new NotFoundException('Class not found');
      }

      const uniqueStudentIds = Array.from(new Set([...existingClass.studentIds, ...studentIds]));
      existingClass.studentIds = uniqueStudentIds;

      return await this.classRepository.save(existingClass);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error adding students to class: ${error.message}`);
    }
  }

  async removeStudentsFromClass(classId: string, studentIds: string[]): Promise<Class> {
    try {
      const existingClass = await this.findOne(classId);
      if (!existingClass) {
        throw new NotFoundException('Class not found');
      }

      existingClass.studentIds = existingClass.studentIds.filter(id => !studentIds.includes(id));

      return await this.classRepository.save(existingClass);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error removing students from class: ${error.message}`);
    }
  }

  async findClassesByProfessor(professorId: string): Promise<Class[]> {
    try {
      return await this.classRepository.find({ where: { professorId } });
    } catch (error) {
      throw new InternalServerErrorException(`Error retrieving classes by professor: ${error.message}`);
    }
  }
  
  async findClassesByStudent(studentId: string): Promise<Class[]> {
    try {
      const allClasses = await this.classRepository.find();
      return allClasses.filter(c => c.studentIds.includes(studentId));
    } catch (error) {
      throw new InternalServerErrorException(`Error retrieving classes by student: ${error.message}`);
    }
  }
}
