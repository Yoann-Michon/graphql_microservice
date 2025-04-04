import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Role } from '@guards/roles_guard/role.enum';

@ObjectType()
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  @Field(()=>String,{ description: 'Unique identifier for the user' })
  id: string;

  @Column({ unique: true, nullable: false })
  @Field(()=>String,{ description: 'User email (must be unique)' })
  email: string;

  @Column({ nullable: false })
  @Field(()=>String,{ description: 'User first name' })
  firstname: string;

  @Column({ nullable: false })
  @Field(()=>String,{ description: 'User last name' })
  lastname: string;

  @Column({ nullable: false })
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.STUDENT, nullable: false })
  @Field(()=>Role,{ description: 'User role (STUDENT, PROFESSOR)' })
  role: Role;
}
