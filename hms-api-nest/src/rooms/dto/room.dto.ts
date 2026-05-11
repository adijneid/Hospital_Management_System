import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { EmptyToUndefined } from '../../common/empty-to-undefined.decorator';
import type { RoomStatus, RoomType } from '../room.entity';

const ROOM_TYPES = ['consultation', 'treatment', 'surgery'] as const;
const ROOM_STATUSES = ['available', 'occupied', 'maintenance'] as const;

export class CreateRoomDto {
  @ApiProperty({ example: '101' })
  @IsString()
  @MinLength(1)
  room_number: string;

  @ApiProperty({ enum: ROOM_TYPES })
  @IsIn(ROOM_TYPES)
  room_type: RoomType;

  @ApiProperty({ example: 1 })
  @IsInt()
  floor: number;

  @ApiProperty({ minimum: 1, example: 1 })
  @IsInt()
  @Min(1)
  capacity: number;
}

export class UpdateRoomDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  room_number?: string;

  @ApiPropertyOptional({ enum: ROOM_TYPES })
  @EmptyToUndefined()
  @IsOptional()
  @IsIn(ROOM_TYPES)
  room_type?: RoomType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  floor?: number;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ enum: ROOM_STATUSES })
  @EmptyToUndefined()
  @IsOptional()
  @IsIn(ROOM_STATUSES)
  status?: RoomStatus;
}

export class UpdateRoomStatusDto {
  @ApiProperty({ enum: ROOM_STATUSES, example: 'occupied' })
  @IsIn(ROOM_STATUSES)
  status: RoomStatus;
}
