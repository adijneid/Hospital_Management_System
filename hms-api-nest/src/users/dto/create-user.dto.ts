import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { EmptyToUndefined } from '../../common/empty-to-undefined.decorator';
import type { UserRole } from '../user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'new.user@hms.lb' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 3, example: 'new.user' })
  @IsString()
  @MinLength(3)
  username: string;

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
  full_name: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'updated@hms.lb' })
  @EmptyToUndefined()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ minLength: 3 })
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;

  @ApiPropertyOptional({ enum: ['staff', 'doctor'] })
  @EmptyToUndefined()
  @IsOptional()
  @IsIn(['staff', 'doctor'])
  role?: UserRole;

  @ApiPropertyOptional()
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  @MinLength(1)
  full_name?: string;
}
