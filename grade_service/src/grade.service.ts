import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Grade } from './entities/grade.entity';
import { CreateGradeInput } from './dto/create-grade.input';
import { UpdateGradeInput } from './dto/update-grade.input';
import { Statistics } from './entities/statistics.entity';

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
      if (error instanceof NotFoundException) {
        throw error;
      }
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
      if (error instanceof NotFoundException) {
        throw error;
      }
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
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error deleting grade: ${error.message}`);
    }
  }


  async findAllGradesForClass(classId: string): Promise<Grade[]> {
    try {
      return await this.gradeRepository.find({ where: { classId } });
    } catch (error) {
      throw new InternalServerErrorException(`Error retrieving grades for class: ${error.message}`);
    }
  }

  async getStudentStatistics(studentId: string): Promise<Statistics> {
    try {
      const grades = await this.findAllGradesForStudent(studentId);
      if (grades.length === 0) {
        throw new NotFoundException(`No grades found for student with ID ${studentId}`);
      }
      
      const gradeValues = grades.map(g => g.grade);
      return this.calculateStatistics(gradeValues);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error calculating student statistics: ${error.message}`);
    }
  }

  async getClassStatistics(classId: string): Promise<Statistics> {
    try {
      const grades = await this.findAllGradesForClass(classId);
      if (grades.length === 0) {
        throw new NotFoundException(`No grades found for class with ID ${classId}`);
      }
      
      const gradeValues = grades.map(g => g.grade);
      const stats = this.calculateStatistics(gradeValues);
      
      const passingThreshold = 10;
      const passingCount = gradeValues.filter(grade => grade >= passingThreshold).length;
      stats.passingRate = (passingCount / gradeValues.length) * 100;
      
      return stats;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error calculating class statistics: ${error.message}`);
    }
  }

  calculateStatistics(grades: number[]): Statistics {
    if (grades.length === 0) {
      throw new Error('Cannot calculate statistics for an empty array of grades');
    }
    
    return {
      average: this.calculateAverage(grades),
      median: this.calculateMedian(grades),
      lowest: this.calculateLowestGrade(grades),
      highest: this.calculateHighestGrade(grades),
      count: grades.length
    };
  }

  calculateAverage(grades: number[]): number {
    const sum = grades.reduce((acc, grade) => acc + grade, 0);
    return parseFloat((sum / grades.length).toFixed(2));
  }

  calculateMedian(grades: number[]): number {
    const sortedGrades = [...grades].sort((a, b) => a - b);
    const middle = Math.floor(sortedGrades.length / 2);
    
    if (sortedGrades.length % 2 === 0) {
      return parseFloat(((sortedGrades[middle - 1] + sortedGrades[middle]) / 2).toFixed(2));
    }
    
    return sortedGrades[middle];
  }

  calculateLowestGrade(grades: number[]): number {
    return Math.min(...grades);
  }

  calculateHighestGrade(grades: number[]): number {
    return Math.max(...grades);
  }

}
