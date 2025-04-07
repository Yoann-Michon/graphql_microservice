import { Test, TestingModule } from '@nestjs/testing';
import { ClassResolver } from './class.resolver';
import { ClassService } from './class.service';
import { Class } from './entities/class.entity';
import { CreateClassInput } from './dto/create-class.input';
import { UpdateClassInput } from './dto/update-class.input';
import {  NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { AuthGuardService } from '@guards/auth_guard/auth_guard.service';
describe('ClassResolver', () => {
  let resolver: ClassResolver;
  let classService: ClassService;

  const mockClassService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addStudentsToClass: jest.fn(),
    removeStudentsFromClass: jest.fn(),
    findClassesByProfessor: jest.fn(),
    findClassesByStudent: jest.fn(),
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
        ClassResolver,
        {
          provide: ClassService,
          useValue: mockClassService,
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

    resolver = module.get<ClassResolver>(ClassResolver);
    classService = module.get<ClassService>(ClassService);
    
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createClass', () => {
    it('should create a new class', async () => {
      const createClassInput: CreateClassInput = {
        name: 'Test Class',
        professorId: 'prof-id-1',
        studentIds: ['student-id-1', 'student-id-2'],
      };

      const expectedClass: Class = {
        id: 'class-id-1',
        name: 'Test Class',
        professorId: 'prof-id-1',
        studentIds: ['student-id-1', 'student-id-2'],
      };

      mockClassService.create.mockResolvedValueOnce(expectedClass);

      const result = await resolver.createClass(createClassInput);

      expect(mockClassService.create).toHaveBeenCalledWith(createClassInput);
      expect(result).toEqual(expectedClass);
    });

    it('should throw NotFoundException if professor not found', async () => {
      const createClassInput: CreateClassInput = {
        name: 'Test Class',
        professorId: 'invalid-prof-id',
        studentIds: ['student-id-1'],
      };

      mockClassService.create.mockRejectedValueOnce(
        new NotFoundException('Professor with ID invalid-prof-id not found')
      );

      await expect(resolver.createClass(createClassInput)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if students not found', async () => {
      const createClassInput: CreateClassInput = {
        name: 'Test Class',
        professorId: 'prof-id-1',
        studentIds: ['invalid-student-id'],
      };

      mockClassService.create.mockRejectedValueOnce(
        new NotFoundException('Students not found: invalid-student-id')
      );

      await expect(resolver.createClass(createClassInput)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return an array of classes', async () => {
      const expectedClasses: Class[] = [
        {
          id: 'class-id-1',
          name: 'Class 1',
          professorId: 'prof-id-1',
          studentIds: ['student-id-1'],
        },
        {
          id: 'class-id-2',
          name: 'Class 2',
          professorId: 'prof-id-2',
          studentIds: ['student-id-2', 'student-id-3'],
        },
      ];

      mockClassService.findAll.mockResolvedValueOnce(expectedClasses);

      const result = await resolver.findAll();

      expect(mockClassService.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedClasses);
    });
  });

  describe('findOne', () => {
    it('should return a class by id', async () => {
      const classId = 'class-id-1';
      const expectedClass: Class = {
        id: classId,
        name: 'Class 1',
        professorId: 'prof-id-1',
        studentIds: ['student-id-1', 'student-id-2'],
      };

      mockClassService.findOne.mockResolvedValueOnce(expectedClass);

      const result = await resolver.findOne(classId);

      expect(mockClassService.findOne).toHaveBeenCalledWith(classId);
      expect(result).toEqual(expectedClass);
    });

    it('should return null if class not found', async () => {
      const classId = 'non-existent-id';

      mockClassService.findOne.mockResolvedValueOnce(null);

      const result = await resolver.findOne(classId);

      expect(mockClassService.findOne).toHaveBeenCalledWith(classId);
      expect(result).toBeNull();
    });
  });

  describe('updateClass', () => {
    it('should update a class successfully', async () => {
      const updateClassInput: UpdateClassInput = {
        id: 'class-id-1',
        name: 'Updated Class Name',
      };

      const updatedClass: Class = {
        id: 'class-id-1',
        name: 'Updated Class Name',
        professorId: 'prof-id-1',
        studentIds: ['student-id-1', 'student-id-2'],
      };

      mockClassService.update.mockResolvedValueOnce(updatedClass);

      const result = await resolver.updateClass(updateClassInput);

      expect(mockClassService.update).toHaveBeenCalledWith(updateClassInput);
      expect(result).toEqual(updatedClass);
    });

    it('should throw NotFoundException if class not found', async () => {
      const updateClassInput: UpdateClassInput = {
        id: 'non-existent-id',
        name: 'Updated Class Name',
      };

      mockClassService.update.mockRejectedValueOnce(new NotFoundException('Class not found'));

      await expect(resolver.updateClass(updateClassInput)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeClass', () => {
    it('should remove a class successfully', async () => {
      const classId = 'class-id-1';
      const deleteResult = { affected: 1, raw: {} };

      mockClassService.remove.mockResolvedValueOnce(deleteResult);

      const result = await resolver.removeClass(classId);

      expect(mockClassService.remove).toHaveBeenCalledWith(classId);
      expect(result).toEqual(deleteResult);
    });

    it('should throw NotFoundException if class not found', async () => {
      const classId = 'non-existent-id';

      mockClassService.remove.mockRejectedValueOnce(new NotFoundException('Class not found'));

      await expect(resolver.removeClass(classId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if class has students', async () => {
      const classId = 'class-with-students';

      mockClassService.remove.mockRejectedValueOnce(
        new NotFoundException('Class cannot be deleted because it contains students')
      );

      await expect(resolver.removeClass(classId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('addStudentsToClass', () => {
    it('should add students to a class successfully', async () => {
      const classId = 'class-id-1';
      const studentIds = ['student-id-3', 'student-id-4'];
      
      const updatedClass: Class = {
        id: classId,
        name: 'Class 1',
        professorId: 'prof-id-1',
        studentIds: ['student-id-1', 'student-id-2', 'student-id-3', 'student-id-4'],
      };

      mockClassService.addStudentsToClass.mockResolvedValueOnce(updatedClass);

      const result = await resolver.addStudentsToClass(classId, studentIds);

      expect(mockClassService.addStudentsToClass).toHaveBeenCalledWith(classId, studentIds);
      expect(result).toEqual(updatedClass);
    });

    it('should throw NotFoundException if class not found', async () => {
      const classId = 'non-existent-id';
      const studentIds = ['student-id-1'];

      mockClassService.addStudentsToClass.mockRejectedValueOnce(new NotFoundException('Class not found'));

      await expect(resolver.addStudentsToClass(classId, studentIds)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if students not found', async () => {
      const classId = 'class-id-1';
      const studentIds = ['invalid-student-id'];

      mockClassService.addStudentsToClass.mockRejectedValueOnce(
        new NotFoundException('Students not found: invalid-student-id')
      );

      await expect(resolver.addStudentsToClass(classId, studentIds)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeStudentsFromClass', () => {
    it('should remove students from a class successfully', async () => {
      const classId = 'class-id-1';
      const studentIds = ['student-id-2'];
      
      const updatedClass: Class = {
        id: classId,
        name: 'Class 1',
        professorId: 'prof-id-1',
        studentIds: ['student-id-1'],
      };

      mockClassService.removeStudentsFromClass.mockResolvedValueOnce(updatedClass);

      const result = await resolver.removeStudentsFromClass(classId, studentIds);

      expect(mockClassService.removeStudentsFromClass).toHaveBeenCalledWith(classId, studentIds);
      expect(result).toEqual(updatedClass);
    });

    it('should throw NotFoundException if class not found', async () => {
      const classId = 'non-existent-id';
      const studentIds = ['student-id-1'];

      mockClassService.removeStudentsFromClass.mockRejectedValueOnce(new NotFoundException('Class not found'));

      await expect(resolver.removeStudentsFromClass(classId, studentIds)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findClassesByProfessor', () => {
    it('should return classes by professor id', async () => {
      const professorId = 'prof-id-1';
      const expectedClasses: Class[] = [
        {
          id: 'class-id-1',
          name: 'Class 1',
          professorId: professorId,
          studentIds: ['student-id-1'],
        },
        {
          id: 'class-id-2',
          name: 'Class 2',
          professorId: professorId,
          studentIds: ['student-id-2'],
        },
      ];

      mockClassService.findClassesByProfessor.mockResolvedValueOnce(expectedClasses);

      const result = await resolver.findClassesByProfessor(professorId);

      expect(mockClassService.findClassesByProfessor).toHaveBeenCalledWith(professorId);
      expect(result).toEqual(expectedClasses);
    });
  });

  describe('findClassesByStudent', () => {
    it('should return classes by student id', async () => {
      const studentId = 'student-id-1';
      const expectedClasses: Class[] = [
        {
          id: 'class-id-1',
          name: 'Class 1',
          professorId: 'prof-id-1',
          studentIds: [studentId, 'student-id-2'],
        },
        {
          id: 'class-id-3',
          name: 'Class 3',
          professorId: 'prof-id-2',
          studentIds: [studentId, 'student-id-3'],
        },
      ];

      mockClassService.findClassesByStudent.mockResolvedValueOnce(expectedClasses);

      const result = await resolver.findClassesByStudent(studentId);

      expect(mockClassService.findClassesByStudent).toHaveBeenCalledWith(studentId);
      expect(result).toEqual(expectedClasses);
    });
  });
});