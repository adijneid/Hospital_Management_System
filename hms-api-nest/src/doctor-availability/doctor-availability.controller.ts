import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
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
import { DoctorAvailabilityService } from './doctor-availability.service';
import {
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
} from './dto/availability.dto';

@ApiTags('doctor-availability')
@ApiBearerAuth('JWT')
@Controller('doctor-availability')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorAvailabilityController {
  constructor(private readonly availability: DoctorAvailabilityService) {}

  @Get()
  @ApiOperation({ summary: 'List all weekly availability rows' })
  list() {
    return this.availability.findAll();
  }

  @Get('doctor/:doctorId')
  @ApiOperation({ summary: 'Weekly availability for a doctor' })
  @ApiParam({ name: 'doctorId', format: 'uuid' })
  byDoctor(@Param('doctorId', new ParseUUIDPipe()) doctorId: string) {
    return this.availability.findByDoctor(doctorId);
  }

  @Get('doctor/:doctorId/day')
  @ApiOperation({ summary: "Doctor's availability slots for one weekday" })
  @ApiParam({ name: 'doctorId', format: 'uuid' })
  @ApiQuery({
    name: 'day_of_week',
    required: true,
    schema: { type: 'integer', minimum: 0, maximum: 6 },
    description: '0=Sunday … 6=Saturday',
  })
  byDoctorAndDay(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('day_of_week') dayOfWeekRaw?: string,
  ) {
    const day = parseInt(dayOfWeekRaw ?? '', 10);
    if (Number.isNaN(day) || day < 0 || day > 6) {
      throw new BadRequestException({
        message: 'day_of_week must be between 0 and 6',
      });
    }
    return this.availability.findByDoctorAndDay(doctorId, day);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single availability slot by id' })
  @ApiParam({ name: 'id', schema: { type: 'integer' } })
  get(@Param('id', new ParseIntPipe()) id: number) {
    return this.availability.findById(id);
  }

  @Post()
  @Roles('staff')
  @ApiOperation({ summary: 'Add an availability slot (staff only)' })
  create(@Body() dto: CreateAvailabilityDto) {
    return this.availability.create(dto);
  }

  @Put(':id')
  @Roles('staff')
  @ApiOperation({ summary: 'Update an availability slot (staff only)' })
  @ApiParam({ name: 'id', schema: { type: 'integer' } })
  update(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.availability.update(id, dto);
  }

  @Delete(':id')
  @Roles('staff')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an availability slot (staff only)' })
  @ApiParam({ name: 'id', schema: { type: 'integer' } })
  remove(@Param('id', new ParseIntPipe()) id: number) {
    return this.availability.remove(id);
  }

  @Delete('doctor/:doctorId')
  @Roles('staff')
  @HttpCode(204)
  @ApiOperation({ summary: "Wipe a doctor's entire weekly schedule (staff only)" })
  @ApiParam({ name: 'doctorId', format: 'uuid' })
  removeAll(@Param('doctorId', new ParseUUIDPipe()) doctorId: string) {
    return this.availability.removeAllForDoctor(doctorId);
  }
}
