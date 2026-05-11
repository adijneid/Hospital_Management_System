import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { EmptyToUndefined } from '../../common/empty-to-undefined.decorator';
import type { UserRole } from '../../users/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'new.user@hms.lb' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 6, example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: ['staff', 'doctor'], example: 'staff' })
  @IsIn(['staff', 'doctor'])
  role: UserRole;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @MinLength(1)
  fullName: string;

  @ApiPropertyOptional({
    description: 'Optional username; auto-derived from email if omitted',
    example: 'jane.doe',
  })
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;
}
