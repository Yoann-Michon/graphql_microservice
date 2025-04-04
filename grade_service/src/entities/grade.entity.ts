import { ObjectType, Field, Float } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column} from 'typeorm';

@ObjectType()
@Entity()
export class Grade {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => String)
  id: string;

  @Column()
  @Field(() => String, { description: 'Student ID associated with this grade' })
  studentId: string;

  @Column()
  @Field(() => String, { description: 'Professor ID associated with this grade' })
  professorId: string;

  @Column()
  @Field(() => String, { description: 'ID of the class' })
  classId: string;

  @Column('float')
  @Field(() => Float, { description: 'Grade obtained in the course' })
  grade: number;
}
