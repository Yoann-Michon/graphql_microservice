import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@ObjectType()
@Entity()
export class Class {
  @PrimaryGeneratedColumn('uuid')
  @Field(()=>String,{ description: 'Unique identifier for the class' })
  id: string;

  @Column()
  @Field(()=>String,{ description: 'Name of the class' })
  name: string;

  @Column()
  @Field(() => String, { description: 'Professor ID associated with this class' })
  professorId: string;

  @Column('json')
  @Field(() => [String], { description: 'List of student IDs associated with this class' })
  studentIds: string[];
}
