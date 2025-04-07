import { Test, TestingModule } from '@nestjs/testing';
import { GradeResolver } from './grade.resolver';
import { GradeService } from './grade.service';
import { Grade } from './entities/grade.entity';
import { CreateGradeInput } from './dto/create-grade.input';
import { UpdateGradeInput } from './dto/update-grade.input';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Statistics } from './entities/statistics.entity';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { AuthGuardService } from '@guards/auth_guard/auth_guard.service';

describe('GradeResolver', () => {
  let resolver: GradeResolver;
  let gradeService: GradeService;

  const mockGradeService = {
    create: jest.fn(),
    findAllGradesForStudent: jest.fn(),
    findGradeForStudentInClass: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findAllGradesForClass: jest.fn(),
    getStudentStatistics: jest.fn(),
    getClassStatistics: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
  };

  const mockAuthGuardService = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradeResolver,
        {
          provide: GradeService,
          useValue: mockGradeService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
            getAllAndOverride: jest.fn(),
            getAllAndMerge: jest.fn(),
          },
        },
        {
          provide: AuthGuardService,
          useValue: mockAuthGuardService,
        },
      ],
    }).compile();

    resolver = module.get<GradeResolver>(GradeResolver);
    gradeService = module.get<GradeService>(GradeService);
    
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createGrade', () => {
    it('should create a new grade', async () => {
      const createGradeInput: CreateGradeInput = {
        studentId: 'student-id-1',
        classId: 'class-id-1',
        grade: 85,
        professorId: 'professor-id-1',
      };

      const expectedGrade: Grade = {
        id: 'grade-id-1',
        studentId: 'student-id-1',
        classId: 'class-id-1',
        grade: 85,
        professorId: 'professor-id-1',
      };

      mockGradeService.create.mockResolvedValueOnce(expectedGrade);

      const result = await resolver.createGrade(createGradeInput);

      expect(mockGradeService.create).toHaveBeenCalledWith(createGradeInput);
      expect(result).toEqual(expectedGrade);
    });

    it('should throw BadRequestException if grade already exists', async () => {
      const createGradeInput: CreateGradeInput = {
        studentId: 'student-id-1',
        classId: 'class-id-1',
        grade: 85,
        professorId: 'professor-id-1',
      };

      mockGradeService.create.mockRejectedValueOnce(
        new BadRequestException('Grade already exists for this student in this class')
      );

      await expect(resolver.createGrade(createGradeInput)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllGradesForStudent', () => {
    it('should return all grades for a student', async () => {
      const studentId = 'student-id-1';
      const expectedGrades: Grade[] = [
        {
          id: 'grade-id-1',
          studentId: studentId,
          classId: 'class-id-1',
          grade: 85,
          professorId: 'professor-id-1',
        },
        {
          id: 'grade-id-2',
          studentId: studentId,
          classId: 'class-id-2',
          grade: 90,
          professorId: 'professor-id-2',
        },
      ];

      mockGradeService.findAllGradesForStudent.mockResolvedValueOnce(expectedGrades);

      const result = await resolver.findAllGradesForStudent(studentId);

      expect(mockGradeService.findAllGradesForStudent).toHaveBeenCalledWith(studentId);
      expect(result).toEqual(expectedGrades);
    });
  });

  describe('findGradeForStudentInClass', () => {
    it('should return a grade for a student in a class', async () => {
      const studentId = 'student-id-1';
      const classId = 'class-id-1';
      const expectedGrade: Grade = {
        id: 'grade-id-1',
        studentId: studentId,
        classId: classId,
        grade: 85,
        professorId: 'professor-id-1',
      };

      mockGradeService.findGradeForStudentInClass.mockResolvedValueOnce(expectedGrade);

      const result = await resolver.findGradeForStudentInClass(studentId, classId);

      expect(mockGradeService.findGradeForStudentInClass).toHaveBeenCalledWith(studentId, classId);
      expect(result).toEqual(expectedGrade);
    });

    it('should return null if grade not found', async () => {
      const studentId = 'student-id-1';
      const classId = 'non-existent-class-id';

      mockGradeService.findGradeForStudentInClass.mockResolvedValueOnce(null);

      const result = await resolver.findGradeForStudentInClass(studentId, classId);

      expect(mockGradeService.findGradeForStudentInClass).toHaveBeenCalledWith(studentId, classId);
      expect(result).toBeNull();
    });
  });

  describe('updateGrade', () => {
    it('should update a grade successfully', async () => {
      const updateGradeInput: UpdateGradeInput = {
        id: 'grade-id-1',
        studentId: 'student-id-1',
        classId: 'class-id-1',
        grade: 95,
      };

      const updatedGrade: Grade = {
        id: 'grade-id-1',
        studentId: 'student-id-1',
        classId: 'class-id-1',
        grade: 95,
        professorId: 'professor-id-1',
      };

      mockGradeService.update.mockResolvedValueOnce(updatedGrade);

      const result = await resolver.updateGrade(updateGradeInput);

      expect(mockGradeService.update).toHaveBeenCalledWith(updateGradeInput);
      expect(result).toEqual(updatedGrade);
    });

    it('should throw NotFoundException if grade not found', async () => {
      const updateGradeInput: UpdateGradeInput = {
        id: 'grade-id-1',
        studentId: 'student-id-1',
        classId: 'non-existent-class-id',
        grade: 95,
      };

      mockGradeService.update.mockRejectedValueOnce(new NotFoundException('Grade not found'));

      await expect(resolver.updateGrade(updateGradeInput)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeGrade', () => {
    it('should remove a grade successfully', async () => {
      const studentId = 'student-id-1';
      const classId = 'class-id-1';

      mockGradeService.remove.mockResolvedValueOnce(undefined);

      const result = await resolver.removeGrade(studentId, classId);

      expect(mockGradeService.remove).toHaveBeenCalledWith(studentId, classId);
      expect(result).toBe(true);
    });

    it('should throw NotFoundException if grade not found', async () => {
      const studentId = 'student-id-1';
      const classId = 'non-existent-class-id';

      mockGradeService.remove.mockRejectedValueOnce(new NotFoundException('Grade not found'));

      await expect(resolver.removeGrade(studentId, classId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllGradesForClass', () => {
    it('should return all grades for a class', async () => {
      const classId = 'class-id-1';
      const expectedGrades: Grade[] = [
        {
          id: 'grade-id-1',
          studentId: 'student-id-1',
          classId: classId,
          grade: 85,
          professorId: 'professor-id-1',
        },
        {
          id: 'grade-id-2',
          studentId: 'student-id-2',
          classId: classId,
          grade: 90,
          professorId: 'professor-id-2',
        },
      ];

      mockGradeService.findAllGradesForClass.mockResolvedValueOnce(expectedGrades);

      const result = await resolver.findAllGradesForClass(classId);

      expect(mockGradeService.findAllGradesForClass).toHaveBeenCalledWith(classId);
      expect(result).toEqual(expectedGrades);
    });
  });

  describe('getStudentStatistics', () => {
    it('should return statistics for a student', async () => {
      const studentId = 'student-id-1';
      const expectedStats: Statistics = {
        average: 87.5,
        median: 87.5,
        lowest: 85,
        highest: 90,
        count: 2,
      };

      mockGradeService.getStudentStatistics.mockResolvedValueOnce(expectedStats);

      const result = await resolver.getStudentStatistics(studentId);

      expect(mockGradeService.getStudentStatistics).toHaveBeenCalledWith(studentId);
      expect(result).toEqual(expectedStats);
    });

    it('should throw NotFoundException if no grades found for student', async () => {
      const studentId = 'student-no-grades';

      mockGradeService.getStudentStatistics.mockRejectedValueOnce(
        new NotFoundException(`No grades found for student with ID ${studentId}`)
      );

      await expect(resolver.getStudentStatistics(studentId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getClassStatistics', () => {
    it('should return statistics for a class', async () => {
      const classId = 'class-id-1';
      const expectedStats: Statistics = {
        average: 87.5,
        median: 87.5,
        lowest: 85,
        highest: 90,
        count: 2,
        passingRate: 100,
      };

      mockGradeService.getClassStatistics.mockResolvedValueOnce(expectedStats);

      const result = await resolver.getClassStatistics(classId);

      expect(mockGradeService.getClassStatistics).toHaveBeenCalledWith(classId);
      expect(result).toEqual(expectedStats);
    });

    it('should throw NotFoundException if no grades found for class', async () => {
      const classId = 'class-no-grades';

      mockGradeService.getClassStatistics.mockRejectedValueOnce(
        new NotFoundException(`No grades found for class with ID ${classId}`)
      );

      await expect(resolver.getClassStatistics(classId)).rejects.toThrow(NotFoundException);
    });
  });
});