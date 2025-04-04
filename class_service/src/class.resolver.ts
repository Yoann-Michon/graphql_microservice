import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ClassService } from './class.service';
import { Class } from './entities/class.entity';
import { CreateClassInput } from './dto/create-class.input';
import { UpdateClassInput } from './dto/update-class.input';
import { UseGuards } from '@nestjs/common';
import { ApiKeyGuardService } from '@guards/api_key_guard/api_key_guard.service';
import { Roles } from '@guards/roles_guard/roles.decorator';
import { Role } from '@guards/roles_guard/role.enum';

@Resolver(() => Class)
@UseGuards(ApiKeyGuardService)
export class ClassResolver {
  constructor(private readonly classService: ClassService) {}

  @Mutation(() => Class)
  @Roles(Role.PROFESSOR)
  createClass(@Args('createClassInput') createClassInput: CreateClassInput) {
    return this.classService.create(createClassInput);
  }

  @Roles(Role.PROFESSOR,Role.STUDENT)
  @Query(() => [Class], { name: 'class' })
  findAll() {
    return this.classService.findAll();
  }

  @Roles(Role.PROFESSOR,Role.STUDENT)
  @Query(() => Class, { name: 'class' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.classService.findOne(id);
  }

  @Roles(Role.PROFESSOR)
  @Mutation(() => Class)
  updateClass(@Args('updateClassInput') updateClassInput: UpdateClassInput) {
    return this.classService.update(updateClassInput);
  }

  @Roles(Role.PROFESSOR)
  @Mutation(() => Class)
  removeClass(@Args('id', { type: () => String }) id: string) {
    return this.classService.remove(id);
  }
}
