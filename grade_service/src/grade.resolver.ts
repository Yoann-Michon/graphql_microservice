import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { GradeService } from './grade.service';
import { Grade } from './entities/grade.entity';
import { Roles } from '@guards/roles_guard/roles.decorator';
import { Role } from '@guards/roles_guard/role.enum';
import { CreateGradeInput } from './dto/create-grade.input';
import { UpdateGradeInput } from './dto/update-grade.input';
import { UseGuards } from '@nestjs/common';
import { ApiKeyGuardService } from '@guards/api_key_guard/api_key_guard.service';
import { RolesGuardService } from '@guards/roles_guard/roles_guard.service';
import { AuthGuardService } from '@guards/auth_guard/auth_guard.service';
import { Statistics } from './entities/statistics.entity';
import { Public } from '@guards/roles_guard/public.decorator';

@Resolver(() => Grade)
@UseGuards(ApiKeyGuardService,AuthGuardService,RolesGuardService)
export class GradeResolver {
  constructor(private readonly gradeService: GradeService) {}

  @Mutation(() => Grade)
  @Roles(Role.PROFESSOR)
  createGrade(@Args('createGradeInput') createGradeInput: CreateGradeInput) {
    return this.gradeService.create(createGradeInput);
  }

  @Query(() => [Grade], { name: 'gradesForStudent' })
  @Public()
  findAllGradesForStudent(@Args('studentId', { type: () => String }) studentId: string) {
    return this.gradeService.findAllGradesForStudent(studentId);
  }

  @Public()
  @Query(() => Grade, { name: 'gradeForStudentInClass' })
  @Roles(Role.PROFESSOR, Role.STUDENT)
  findGradeForStudentInClass(
    @Args('studentId', { type: () => String }) studentId: string,
    @Args('classId', { type: () => String }) classId: string
  ) {
    return this.gradeService.findGradeForStudentInClass(studentId, classId);
  }

  @Mutation(() => Grade)
  @Roles(Role.PROFESSOR)
  updateGrade(@Args('updateGradeInput') updateGradeInput: UpdateGradeInput) {
    return this.gradeService.update(updateGradeInput);
  }

  @Mutation(() => Boolean)
  @Roles(Role.PROFESSOR)
  async removeGrade(
    @Args('studentId', { type: () => String }) studentId: string,
    @Args('classId', { type: () => String }) classId: string
  ) {
    await this.gradeService.remove(studentId, classId);
    return true;
  }

  @Query(() => [Grade], { name: 'classGrades' })
  @UseGuards(RolesGuardService)
  @Public()
  findAllGradesForClass(
    @Args('classId') classId: string,
  ): Promise<Grade[]> {
    return this.gradeService.findAllGradesForClass(classId);
  }

  @Query(() => Statistics, { name: 'studentStatistics' })
  @UseGuards(RolesGuardService)
  @Roles(Role.PROFESSOR, Role.STUDENT)
  getStudentStatistics(
    @Args('studentId') studentId: string,
  ): Promise<Statistics> {
    return this.gradeService.getStudentStatistics(studentId);
  }

  @Query(() => Statistics, { name: 'classStatistics' })
  @UseGuards(RolesGuardService)
  @Roles(Role.PROFESSOR)
  getClassStatistics(
    @Args('classId') classId: string,
  ): Promise<Statistics> {
    return this.gradeService.getClassStatistics(classId);
  }

}
