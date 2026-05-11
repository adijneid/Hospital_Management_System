import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  CreateRoomDto,
  UpdateRoomDto,
  UpdateRoomStatusDto,
} from './dto/room.dto';
import type { RoomType } from './room.entity';
import { RoomsService } from './rooms.service';

const ROOM_TYPES: RoomType[] = ['consultation', 'treatment', 'surgery'];

function assertRoomType(value: string | undefined): RoomType {
  if (!value || !ROOM_TYPES.includes(value as RoomType)) {
    throw new BadRequestException({
      message: 'room_type must be consultation, treatment, or surgery',
    });
  }
  return value as RoomType;
}

@ApiTags('rooms')
@ApiBearerAuth('JWT')
@Controller('rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @Get()
  @ApiOperation({ summary: 'List all rooms' })
  list() {
    return this.rooms.findAll();
  }

  @Get('count')
  @ApiOperation({ summary: 'Total room count' })
  async getCount() {
    return { count: await this.rooms.count() };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Room counts grouped by status' })
  stats() {
    return this.rooms.stats();
  }

  @Get('available/count')
  @ApiOperation({ summary: 'Count of `available` rooms' })
  async availableCount() {
    return { count: await this.rooms.countAvailable() };
  }

  @Get('available/type')
  @ApiOperation({ summary: 'Available rooms of a given type' })
  @ApiQuery({ name: 'room_type', enum: ROOM_TYPES, required: true })
  availableByType(@Query('room_type') roomType?: string) {
    return this.rooms.findAvailableByType(assertRoomType(roomType));
  }

  @Get('available')
  @ApiOperation({ summary: 'All available rooms' })
  available() {
    return this.rooms.findAvailable();
  }

  @Get('number')
  @ApiOperation({ summary: 'Find a room by its room_number' })
  @ApiQuery({ name: 'room_number', required: true })
  async byNumber(@Query('room_number') roomNumber?: string) {
    if (!roomNumber) {
      throw new BadRequestException({ message: 'Room number is required' });
    }
    const room = await this.rooms.findByNumber(roomNumber);
    if (!room) throw new NotFoundException({ message: 'Room not found' });
    return room;
  }

  @Get('type')
  @ApiOperation({ summary: 'List rooms by type' })
  @ApiQuery({ name: 'room_type', enum: ROOM_TYPES, required: true })
  byType(@Query('room_type') roomType?: string) {
    return this.rooms.findByType(assertRoomType(roomType));
  }

  @Get('floor')
  @ApiOperation({ summary: 'List rooms on a given floor' })
  @ApiQuery({ name: 'floor', required: true, schema: { type: 'integer' } })
  byFloor(@Query('floor') floorRaw?: string) {
    const floor = parseInt(floorRaw ?? '', 10);
    if (Number.isNaN(floor)) {
      throw new BadRequestException({ message: 'Floor must be a number' });
    }
    return this.rooms.findByFloor(floor);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a room by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async get(@Param('id', new ParseUUIDPipe()) id: string) {
    const room = await this.rooms.findById(id);
    if (!room) throw new NotFoundException({ message: 'Room not found' });
    return room;
  }

  @Post()
  @Roles('staff')
  @ApiOperation({ summary: 'Create a room (staff only)' })
  create(@Body() dto: CreateRoomDto) {
    return this.rooms.create(dto);
  }

  @Put(':id')
  @Roles('staff')
  @ApiOperation({ summary: 'Update a room (staff only)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.rooms.update(id, dto);
  }

  @Put(':id/status')
  @Roles('staff')
  @ApiOperation({ summary: "Update only a room's status" })
  @ApiParam({ name: 'id', format: 'uuid' })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRoomStatusDto,
  ) {
    return this.rooms.updateStatus(id, dto);
  }

  @Delete(':id')
  @Roles('staff')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a room (staff only)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.rooms.remove(id);
  }
}
