import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('RoomStats')
export class RoomStatsModel {
  @Field(() => Int) total: number;
  @Field(() => Int) available: number;
  @Field(() => Int) occupied: number;
  @Field(() => Int) maintenance: number;
}
