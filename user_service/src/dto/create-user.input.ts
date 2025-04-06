import { InputType, Field } from '@nestjs/graphql';
import { Matches, IsNotEmpty, Length, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { Role } from '@guards/roles_guard/role.enum';

@InputType()
export class CreateUserInput {
  @Field(()=>String,{ description: 'User email' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @Field(()=>String,{ description: 'User first name' })
  @IsNotEmpty({ message: 'First name is required' })
  @Length(3, 50, { message: 'First name must be between 3 and 50 characters' })
  firstname: string;

  @Field(()=>String,{ description: 'User last name' })
  @IsNotEmpty({ message: 'Last name is required' })
  @Length(3, 50, { message: 'Last name must be between 3 and 50 characters' })
  lastname: string;

  @Field(()=>String,{ description: 'User password (must contain at least one uppercase letter, one number, and one special character)' })
  @IsNotEmpty({ message: 'Password is required' })
  @Length(6, 50, { message: 'Password must be between 6 and 50 characters' })
  @Matches(/.*[A-Z].*/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/.*[0-9].*/, { message: 'Password must contain at least one number' })
  @Matches(/.*[!@#$%^&*].*/, { message: 'Password must contain at least one special character (!@#$%^&*)' })
  password: string;

  @Field(() => Role,{ description: 'User role (default: STUDENT)', nullable: true })
  @IsOptional()
  @IsEnum(Role, { message: 'Role must be one of the following: STUDENT, PROFESSOR' })
  role?: Role;

  @Field(()=>String,{ description: 'User pseudo', nullable: true })
  @IsOptional()
  pseudo: string;
}
