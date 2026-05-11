import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import { EmptyToUndefined } from '../../common/empty-to-undefined.decorator';
import { IsUuid } from '../../common/is-uuid.decorator';
import type { AppointmentStatus } from '../appointment.entity';

const APPOINTMENT_STATUSES = [
  'scheduled',
  'completed',
  'cancelled',
  'no_show',
] as const;

export class CreateAppointmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUuid()
  patient_id: string;

  @ApiProperty({ format: 'uuid' })
  @IsUuid()
  doctor_id: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @EmptyToUndefined()
  @IsOptional()
  @IsUuid()
  room_id?: string | null;

  @ApiProperty({ format: 'date-time', example: '2026-05-09T09:00:00Z' })
  @IsDateString()
  scheduled_start: string;

  @ApiProperty({ format: 'date-time', example: '2026-05-09T09:30:00Z' })
  @IsDateString()
  scheduled_end: string;

  @ApiPropertyOptional({ example: 'Routine check-up', nullable: true })
  @IsOptional()
  @IsString()
  reason?: string | null;
}

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @EmptyToUndefined()
  @IsOptional()
  @IsUuid()
  patient_id?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @EmptyToUndefined()
  @IsOptional()
  @IsUuid()
  doctor_id?: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @EmptyToUndefined()
  @IsOptional()
  @IsUuid()
  room_id?: string | null;

  @ApiPropertyOptional({ format: 'date-time' })
  @EmptyToUndefined()
  @IsOptional()
  @IsDateString()
  scheduled_start?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @EmptyToUndefined()
  @IsOptional()
  @IsDateString()
  scheduled_end?: string;

  @ApiPropertyOptional({ enum: APPOINTMENT_STATUSES })
  @EmptyToUndefined()
  @IsOptional()
  @IsIn(APPOINTMENT_STATUSES)
  status?: AppointmentStatus;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  reason?: string | null;
}

export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: APPOINTMENT_STATUSES, example: 'completed' })
  @IsIn(APPOINTMENT_STATUSES)
  status: AppointmentStatus;
}
