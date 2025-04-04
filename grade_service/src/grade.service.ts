import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Grade } from './entities/grade.entity';
import { CreateGradeInput } from './dto/create-grade.input';
import { UpdateGradeInput } from './dto/update-grade.input';

@Injectable()
export class GradeService {
  constructor(
    @InjectRepository(Grade) private readonly gradeRepository: Repository<Grade>,
  ) {}

  async create(createGradeInput: CreateGradeInput): Promise<Grade> {
    try {
      const grade = this.gradeRepository.create(createGradeInput);
      return await this.gradeRepository.save(grade);
    } catch (error) {
      throw new InternalServerErrorException(`Error creating grade: ${error.message}`);
    }
  }

  async findAllGradesForStudent(studentId: string): Promise<Grade[]> {
    try {
      return await this.gradeRepository.find({ where: { studentId } });
    } catch (error) {
      throw new InternalServerErrorException(`Error retrieving grades for student: ${error.message}`);
    }
  }

  async findGradeForStudentInClass(studentId: string, classId: string): Promise<Grade | null> {
    try {
      return await this.gradeRepository.findOne({ where: { studentId, classId } });
    } catch (error) {
      throw new InternalServerErrorException(`Error retrieving grade for student in class: ${error.message}`);
    }
  }

  async update(updateGradeInput: UpdateGradeInput): Promise<Grade> {
    try {
      const grade = await this.findGradeForStudentInClass(updateGradeInput.studentId!, updateGradeInput.classId!);
      if (!grade) {
        throw new NotFoundException('Grade not found');
      }
      grade.grade = updateGradeInput.grade ?? grade.grade;
      return await this.gradeRepository.save(grade);
    } catch (error) {
      throw new InternalServerErrorException(`Error updating grade: ${error.message}`);
    }
  }

  async remove(studentId: string, classId: string): Promise<void> {
    try {
      const grade = await this.findGradeForStudentInClass(studentId, classId);
      if (!grade) {
        throw new NotFoundException('Grade not found');
      }
      await this.gradeRepository.remove(grade);
    } catch (error) {
      throw new InternalServerErrorException(`Error deleting grade: ${error.message}`);
    }
  }
}
