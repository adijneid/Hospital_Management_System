import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { EmptyToUndefined } from '../../common/empty-to-undefined.decorator';
import { IsUuid } from '../../common/is-uuid.decorator';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export class CreateAvailabilityDto {
  @ApiProperty({ format: 'uuid' })
  @IsUuid()
  doctor_id: string;

  @ApiProperty({
    minimum: 0,
    maximum: 6,
    description: '0=Sunday … 6=Saturday',
    example: 1,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week: number;

  @ApiProperty({
    description: 'Start time in HH:MM or HH:MM:SS (24h)',
    example: '08:00',
  })
  @IsString()
  @Matches(TIME_REGEX, { message: 'start_time must be HH:MM or HH:MM:SS' })
  start_time: string;

  @ApiProperty({
    description: 'End time in HH:MM or HH:MM:SS (24h)',
    example: '16:00',
  })
  @IsString()
  @Matches(TIME_REGEX, { message: 'end_time must be HH:MM or HH:MM:SS' })
  end_time: string;
}

export class UpdateAvailabilityDto {
  @ApiPropertyOptional({ minimum: 0, maximum: 6 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week?: number;

  @ApiPropertyOptional({ example: '08:00' })
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: 'start_time must be HH:MM or HH:MM:SS' })
  start_time?: string;

  @ApiPropertyOptional({ example: '16:00' })
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: 'end_time must be HH:MM or HH:MM:SS' })
  end_time?: string;
}
