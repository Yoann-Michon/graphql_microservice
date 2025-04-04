import { InputType, Int, Field, Float } from '@nestjs/graphql';

@InputType()
export class CreateGradeInput {
    @Field(() => String, { description: 'Student ID associated with this grade' })
    studentId: string;
  
    @Field(() => String, { description: 'Professor ID associated with this grade' })
    professorId: string;
  
    @Field(() => String, { description: 'ID of the class' })
    classId: string;
  
    @Field(() => Float, { description: 'Grade obtained in the course' })
    grade: number;
}
