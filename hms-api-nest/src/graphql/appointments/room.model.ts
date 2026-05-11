import { Field, Int, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('Room')
export class RoomModel {
  @Field(() => ID) room_id: string;
  @Field() room_number: string;
  @Field({ nullable: true }) room_type?: string;
  @Field(() => Int, { nullable: true }) floor?: number;
  @Field(() => Int, { nullable: true }) capacity?: number;
  @Field({ nullable: true }) status?: string;
}
