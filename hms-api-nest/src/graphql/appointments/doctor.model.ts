import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('Doctor')
export class DoctorModel {
  @Field(() => ID) doctor_id: string;
  @Field() first_name: string;
  @Field() last_name: string;
  @Field() specialty: string;
  @Field({ nullable: true }) phone?: string;
  @Field(() => ID, { nullable: true }) user_id?: string;
}
