import {
  Field,
  GraphQLISODateTime,
  ID,
  ObjectType,
} from '@nestjs/graphql';
import { DoctorModel } from './doctor.model';
import { PatientModel } from './patient.model';
import { RoomModel } from './room.model';

@ObjectType('Appointment')
export class AppointmentModel {
  @Field(() => ID) appointment_id: string;
  @Field(() => GraphQLISODateTime) scheduled_start: Date;
  @Field(() => GraphQLISODateTime) scheduled_end: Date;
  @Field() status: string;
  @Field({ nullable: true }) reason?: string;

  // Resolved by @ResolveField in AppointmentsResolver
  @Field(() => PatientModel) patient: PatientModel;
  @Field(() => DoctorModel) doctor: DoctorModel;
  @Field(() => RoomModel, { nullable: true }) room?: RoomModel;

  // FK ids carried for resolver access; NOT decorated as @Field — never exposed in schema
  patient_id: string;
  doctor_id: string;
  room_id: string | null;
}
