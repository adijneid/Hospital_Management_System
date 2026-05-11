import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { EmptyToUndefined } from '../../common/empty-to-undefined.decorator';

export class CreatePrescriptionDto {
  @ApiProperty({ maxLength: 200, example: 'Metformin' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  medication: string;

  @ApiPropertyOptional({ maxLength: 100, example: '500 mg' })
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  dosage?: string;

  @ApiPropertyOptional({ maxLength: 100, example: 'twice daily' })
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  frequency?: string;

  @ApiPropertyOptional({ maxLength: 100, example: '30 days' })
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  duration?: string;

  @ApiPropertyOptional({ example: 'Take with meals' })
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  instructions?: string;
}

export class UpdatePrescriptionDto {
  @ApiPropertyOptional({ maxLength: 200 })
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  medication?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  dosage?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  frequency?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  duration?: string;

  @ApiPropertyOptional()
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  instructions?: string;
}
