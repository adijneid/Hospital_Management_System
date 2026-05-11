import {
  Field,
  GraphQLISODateTime,
  ID,
  ObjectType,
} from '@nestjs/graphql';

@ObjectType('Patient')
export class PatientModel {
  @Field(() => ID) patient_id: string;
  @Field() first_name: string;
  @Field() last_name: string;
  @Field({ nullable: true }) phone?: string;
  @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) gender?: string;
  @Field({ nullable: true }) blood_type?: string;
  @Field({ nullable: true }) address?: string;
  @Field({ nullable: true }) medical_notes?: string;
  // Postgres DATE returns a plain "YYYY-MM-DD" string, not a Date object —
  // GraphQLISODateTime would reject it. The frontend formatter handles strings.
  @Field(() => String, { nullable: true }) date_of_birth?: string;
  @Field(() => GraphQLISODateTime, { nullable: true }) created_at?: Date;
}
