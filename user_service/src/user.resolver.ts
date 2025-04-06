import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UseGuards } from '@nestjs/common';
import { ApiKeyGuardService } from '@guards/api_key_guard/api_key_guard.service';
import { Public } from '@guards/roles_guard/public.decorator';
import { Roles } from '@guards/roles_guard/roles.decorator';
import { Role } from '@guards/roles_guard/role.enum';
import { RolesGuardService } from '@guards/roles_guard/roles_guard.service';

@Resolver(() => User)
@UseGuards(ApiKeyGuardService,RolesGuardService)//avoir
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.userService.create(createUserInput);
  }

  @Roles(Role.PROFESSOR)
  @Query(() => [User], { name: 'users' })
  findAll() {
    return this.userService.findAll();
  }

  @Roles(Role.PROFESSOR,Role.STUDENT)
  @Query(() => User, { name: 'userById' })
  findOneById(@Args('id', { type: () => String }) id: string) {
    return this.userService.findOneById(id);
  }
  
  @Roles(Role.PROFESSOR, Role.STUDENT)
  @Query(() => [User], { name: 'usersByIds' })
  findUsersByIds(@Args('ids', { type: () => [String] }) ids: string[]) {
    return this.userService.findUsersByIds(ids);
  }
  
  @Roles(Role.PROFESSOR,Role.STUDENT)
  @Query(() => User, { name: 'userByEmail' })
  findOneByEmail(@Args('email', { type: () => String }) email: string) {
    return this.userService.findOneByEmail(email);
  }

  @Roles(Role.PROFESSOR,Role.STUDENT)
  @Mutation(() => User)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return this.userService.update(updateUserInput);
  }

  @Roles(Role.PROFESSOR)
  @Mutation(() => User)
  removeUser(@Args('id', { type: () => String }) id: string) {
    return this.userService.remove(id);
  }

  @Mutation(() => User)
  async verifyPassword(
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<User> {
    const user = await this.userService.validateUser(email, password);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    return user;
  }

  @Mutation(() => User)
@Roles(Role.PROFESSOR)
changeUserRole(
  @Args('userId', { type: () => String }) userId: string,
  @Args('role', { type: () => Role }) role: Role
) {
  return this.userService.changeUserRole(userId, role);
}
}
