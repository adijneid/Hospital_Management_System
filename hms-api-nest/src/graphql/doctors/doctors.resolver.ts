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
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { JwtPayload } from '../../auth/jwt.strategy';
import { DoctorsService } from '../../doctors/doctors.service';
import { DoctorModel } from '../appointments/doctor.model';
import { GqlJwtAuthGuard } from '../gql-jwt-auth.guard';

@InputType()
export class CreateDoctorInput {
  @Field() @IsString() @MinLength(1) first_name: string;
  @Field() @IsString() @MinLength(1) last_name: string;
  @Field() @IsString() @MinLength(1) specialty: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() phone?: string | null;
  @Field(() => ID, { nullable: true }) @IsOptional() @IsString() user_id?: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsEmail() email?: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() @MinLength(6) password?: string;
}

@InputType()
export class UpdateDoctorInput {
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() first_name?: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() last_name?: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() specialty?: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() phone?: string | null;
}

@Resolver(() => DoctorModel)
@UseGuards(GqlJwtAuthGuard)
export class DoctorsResolver {
  constructor(private readonly svc: DoctorsService) {}

  @Query(() => [DoctorModel])
  doctors() {
    return this.svc.findAll();
  }

  @Query(() => DoctorModel, { nullable: true })
  doctor(@Args('id', { type: () => ID }) id: string) {
    return this.svc.findById(id);
  }

  @Query(() => [DoctorModel])
  doctorsBySpecialty(@Args('specialty') specialty: string) {
    return this.svc.findBySpecialty(specialty);
  }

  @Query(() => Int)
  doctorCount() {
    return this.svc.count();
  }

  @Mutation(() => DoctorModel)
  createDoctor(
    @Args('input') input: CreateDoctorInput,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.role !== 'staff') {
      throw new Error('Only staff may create doctors.');
    }
    return this.svc.create(input as any);
  }

  @Mutation(() => DoctorModel)
  updateDoctor(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateDoctorInput,
    @CurrentUser() user: JwtPayload,
  ) {
    // Doctors may only update their own profile; staff may update any doctor.
    if (user.role === 'doctor' && user.doctorId !== id) {
      throw new Error('You can only edit your own profile.');
    }
    return this.svc.update(id, input as any);
  }

  @Mutation(() => Boolean)
  async deleteDoctor(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.role !== 'staff') {
      throw new Error('Only staff may delete doctors.');
    }
    await this.svc.remove(id);
    return true;
  }
}
