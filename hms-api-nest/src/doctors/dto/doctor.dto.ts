import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { EmptyToUndefined } from '../../common/empty-to-undefined.decorator';
import { IsUuid } from '../../common/is-uuid.decorator';

export class CreateDoctorDto {
  @ApiProperty({ example: 'Ahmad' })
  @IsString()
  @MinLength(1)
  first_name: string;

  @ApiProperty({ example: 'Hassan' })
  @IsString()
  @MinLength(1)
  last_name: string;

  @ApiProperty({ example: 'Cardiology' })
  @IsString()
  @MinLength(1)
  specialty: string;

  @ApiPropertyOptional({ example: '+961-70-111001', nullable: true })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional({
    description:
      'Existing user UUID to link this doctor to. Omit to auto-create a new doctor user from email + password.',
    format: 'uuid',
  })
  @EmptyToUndefined()
  @IsOptional()
  @IsUuid()
  user_id?: string;

  @ApiPropertyOptional({
    description: 'Required when `user_id` is omitted: email for the new user.',
    example: 'dr.hassan@hms.lb',
  })
  @EmptyToUndefined()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Required when `user_id` is omitted: password for the new user.',
    minLength: 6,
  })
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

export class UpdateDoctorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string | null;
}
