import { UseGuards } from '@nestjs/common';
import {
  Args,
  Field,
  ID,
  InputType,
  Int,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { IsDateString, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { JwtPayload } from '../../auth/jwt.strategy';
import { PatientsService } from '../../patients/patients.service';
import { PatientModel } from '../appointments/patient.model';
import { GqlJwtAuthGuard } from '../gql-jwt-auth.guard';

const GENDERS = ['Male', 'Female', 'Other'] as const;

@InputType()
export class CreatePatientInput {
  @Field() @IsString() @MinLength(1) first_name: string;
  @Field() @IsString() @MinLength(1) last_name: string;
  @Field() @IsDateString() date_of_birth: string;
  @Field(() => String) @IsIn(GENDERS) gender: 'Male' | 'Female' | 'Other';
  @Field() @IsString() @MinLength(1) phone: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() email?: string | null;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() address?: string | null;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() blood_type?: string | null;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() medical_notes?: string | null;
}

@InputType()
export class UpdatePatientInput {
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() first_name?: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() last_name?: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsDateString() date_of_birth?: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsIn(GENDERS) gender?: 'Male' | 'Female' | 'Other';
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() phone?: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() email?: string | null;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() address?: string | null;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() blood_type?: string | null;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() medical_notes?: string | null;
}

@Resolver(() => PatientModel)
@UseGuards(GqlJwtAuthGuard)
export class PatientsResolver {
  constructor(private readonly svc: PatientsService) {}

  @Query(() => [PatientModel], {
    description: 'List all patients (paginated).',
  })
  patients(
    @Args('limit', { type: () => Int, defaultValue: 100 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ) {
    return this.svc.findAll(limit, offset);
  }

  @Query(() => PatientModel, {
    nullable: true,
    description: 'Find a single patient by id.',
  })
  patient(@Args('id', { type: () => ID }) id: string) {
    return this.svc.findById(id);
  }

  @Query(() => [PatientModel], {
    description:
      'Search patients by name (case-insensitive match on first or last name).',
  })
  searchPatients(@Args('name') name: string) {
    return this.svc.searchByName(name);
  }

  @Query(() => Int, { description: 'Total patient count.' })
  patientCount() {
    return this.svc.count();
  }

  @Mutation(() => PatientModel, {
    description: 'Create a new patient (staff only — RBAC enforced server-side).',
  })
  createPatient(
    @Args('input') input: CreatePatientInput,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.role !== 'staff') {
      throw new Error('Only staff may create patients.');
    }
    return this.svc.create(input as any, user.userId);
  }

  @Mutation(() => PatientModel, { description: 'Update a patient (staff only).' })
  async updatePatient(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdatePatientInput,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.role !== 'staff') {
      throw new Error('Only staff may update patients.');
    }
    return this.svc.update(id, input as any);
  }

  @Mutation(() => Boolean, { description: 'Delete a patient (staff only).' })
  async deletePatient(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.role !== 'staff') {
      throw new Error('Only staff may delete patients.');
    }
    await this.svc.remove(id);
    return true;
  }
}
