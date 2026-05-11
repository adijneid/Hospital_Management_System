import { UseGuards } from '@nestjs/common';
import {
  Args,
  Field,
  GraphQLISODateTime,
  ID,
  InputType,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { IsDate, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { JwtPayload } from '../../auth/jwt.strategy';
import type { AppointmentStatus } from '../../appointments/appointment.entity';
import { AppointmentsService } from '../../appointments/appointments.service';
import { DoctorsService } from '../../doctors/doctors.service';
import { PatientsService } from '../../patients/patients.service';
import { RoomsService } from '../../rooms/rooms.service';
import { GqlJwtAuthGuard } from '../gql-jwt-auth.guard';
import { AppointmentModel } from './appointment.model';
import { DoctorModel } from './doctor.model';
import { PatientModel } from './patient.model';
import { RoomModel } from './room.model';

const APPOINTMENT_STATUSES = ['scheduled', 'completed', 'cancelled', 'no_show'] as const;

@InputType()
export class CreateAppointmentInput {
  @Field(() => ID) @IsUUID() patient_id: string;
  @Field(() => ID) @IsUUID() doctor_id: string;
  @Field(() => ID, { nullable: true }) @IsOptional() @IsUUID() room_id?: string | null;
  @Field(() => GraphQLISODateTime) @IsDate() scheduled_start: Date;
  @Field(() => GraphQLISODateTime) @IsDate() scheduled_end: Date;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() reason?: string | null;
}

@InputType()
export class UpdateAppointmentInput {
  @Field(() => ID, { nullable: true }) @IsOptional() @IsUUID() patient_id?: string;
  @Field(() => ID, { nullable: true }) @IsOptional() @IsUUID() doctor_id?: string;
  @Field(() => ID, { nullable: true }) @IsOptional() @IsUUID() room_id?: string | null;
  @Field(() => GraphQLISODateTime, { nullable: true }) @IsOptional() @IsDate() scheduled_start?: Date;
  @Field(() => GraphQLISODateTime, { nullable: true }) @IsOptional() @IsDate() scheduled_end?: Date;
  @Field(() => String, { nullable: true }) @IsOptional() @IsIn(APPOINTMENT_STATUSES) status?: AppointmentStatus;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() reason?: string | null;
}

@Resolver(() => AppointmentModel)
@UseGuards(GqlJwtAuthGuard)
export class AppointmentsResolver {
  constructor(
    private readonly appts: AppointmentsService,
    private readonly patients: PatientsService,
    private readonly doctors: DoctorsService,
    private readonly rooms: RoomsService,
  ) {}

  @Query(() => [AppointmentModel])
  todaysAppointments(
    @Args('doctorId', { type: () => ID, nullable: true }) doctorId?: string,
  ) {
    return this.appts.findToday(doctorId ?? null);
  }

  @Query(() => [AppointmentModel])
  appointments() {
    return this.appts.findAllWithDetails();
  }

  @Query(() => AppointmentModel, { nullable: true })
  appointment(@Args('id', { type: () => ID }) id: string) {
    return this.appts.findById(id);
  }

  @Query(() => [AppointmentModel])
  appointmentsByPatient(
    @Args('patientId', { type: () => ID }) patientId: string,
  ) {
    return this.appts.findByPatient(patientId);
  }

  @Query(() => [AppointmentModel])
  appointmentsByDoctor(
    @Args('doctorId', { type: () => ID }) doctorId: string,
  ) {
    return this.appts.findByDoctor(doctorId);
  }

  @Mutation(() => AppointmentModel)
  createAppointment(
    @Args('input') input: CreateAppointmentInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.appts.create(
      {
        ...input,
        scheduled_start: input.scheduled_start.toISOString(),
        scheduled_end: input.scheduled_end.toISOString(),
      } as any,
      user.userId,
    );
  }

  @Mutation(() => AppointmentModel)
  updateAppointment(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateAppointmentInput,
  ) {
    const dto: any = { ...input };
    if (input.scheduled_start) dto.scheduled_start = input.scheduled_start.toISOString();
    if (input.scheduled_end) dto.scheduled_end = input.scheduled_end.toISOString();
    return this.appts.update(id, dto);
  }

  @Mutation(() => AppointmentModel)
  updateAppointmentStatus(
    @Args('id', { type: () => ID }) id: string,
    @Args('status') status: AppointmentStatus,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.appts.updateStatus(id, { status }, user.userId);
  }

  @Mutation(() => Boolean)
  async deleteAppointment(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.role !== 'staff') {
      throw new Error('Only staff may delete appointments.');
    }
    await this.appts.remove(id);
    return true;
  }

  @ResolveField(() => PatientModel)
  patient(@Parent() appt: any): Promise<PatientModel | null> {
    return this.patients.findById(appt.patient_id) as any;
  }

  @ResolveField(() => DoctorModel)
  doctor(@Parent() appt: any): Promise<DoctorModel | null> {
    return this.doctors.findById(appt.doctor_id) as any;
  }

  @ResolveField(() => RoomModel, { nullable: true })
  room(@Parent() appt: any): Promise<RoomModel | null> | null {
    return appt.room_id ? (this.rooms.findById(appt.room_id) as any) : null;
  }
}
