import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { EmptyToUndefined } from '../../common/empty-to-undefined.decorator';
import type { Gender } from '../patient.entity';

export class CreatePatientDto {
  @ApiProperty({ example: 'Sara' })
  @IsString()
  @MinLength(1)
  first_name: string;

  @ApiProperty({ example: 'Mansour' })
  @IsString()
  @MinLength(1)
  last_name: string;

  @ApiProperty({ format: 'date', example: '1990-04-15' })
  @IsDateString()
  date_of_birth: string;

  @ApiProperty({ enum: ['Male', 'Female', 'Other'] })
  @IsIn(['Male', 'Female', 'Other'])
  gender: Gender;

  @ApiProperty({ example: '+961-71-200001' })
  @IsString()
  @MinLength(1)
  phone: string;

  @ApiPropertyOptional({ example: 'sara.mansour@email.com', nullable: true })
  @EmptyToUndefined()
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({ example: 'Hamra St., Beirut', nullable: true })
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiPropertyOptional({ example: 'A+', nullable: true })
  @IsOptional()
  @IsString()
  blood_type?: string | null;

  @ApiPropertyOptional({ example: 'Penicillin allergy', nullable: true })
  @IsOptional()
  @IsString()
  medical_notes?: string | null;
}

export class UpdatePatientDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({ format: 'date' })
  @EmptyToUndefined()
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @ApiPropertyOptional({ enum: ['Male', 'Female', 'Other'] })
  @EmptyToUndefined()
  @IsOptional()
  @IsIn(['Male', 'Female', 'Other'])
  gender?: Gender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ nullable: true })
  @EmptyToUndefined()
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  blood_type?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  medical_notes?: string | null;
}
