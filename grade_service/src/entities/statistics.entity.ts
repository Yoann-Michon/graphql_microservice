import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class Statistics {
  @Field(() => Float)
  average: number;

  @Field(() => Float)
  median: number;

  @Field(() => Float)
  lowest: number;

  @Field(() => Float)
  highest: number;

  @Field(() => Int)
  count: number;

  @Field(() => Float, { nullable: true })
  passingRate?: number;
}