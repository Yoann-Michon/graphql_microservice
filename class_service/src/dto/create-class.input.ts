import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsArray, IsString, ArrayNotEmpty, IsOptional } from 'class-validator';

@InputType()
export class CreateClassInput {
  @Field(()=>String,{ description: 'Name of the class' })
  @IsNotEmpty({ message: 'Class name is required' })
  @IsString({ message: 'Class name must be a string' })
  name: string;

  @Field(() => String, { description: 'Professor ID for this class' })
  @IsArray({ message: 'Professor ID must be an array' })
  @ArrayNotEmpty({ message: 'At least one professor ID must be provided' })
  @IsString({ each: true, message: 'Each professor ID must be a string' })
  professorId: string;

  @Field(() => [String], { description: 'List of student IDs for this class' })
  @IsArray({ message: 'Student IDs must be an array' })
  @IsOptional()
  @IsString({ each: true, message: 'Each student ID must be a string' })
  studentIds: string[];
}
