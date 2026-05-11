import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/doctor.dto';

@ApiTags('doctors')
@ApiBearerAuth('JWT')
@Controller('doctors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorsController {
  constructor(private readonly doctors: DoctorsService) {}

  @Get()
  @ApiOperation({ summary: 'List all doctors' })
  list() {
    return this.doctors.findAll();
  }

  @Get('count')
  @ApiOperation({ summary: 'Total doctor count' })
  async getCount() {
    return { count: await this.doctors.count() };
  }

  @Get('specialty')
  @ApiOperation({ summary: 'List doctors filtered by specialty' })
  @ApiQuery({ name: 'specialty', required: true, example: 'Cardiology' })
  getBySpecialty(@Query('specialty') specialty?: string) {
    if (!specialty) {
      throw new BadRequestException({ message: 'Specialty is required' });
    }
    return this.doctors.findBySpecialty(specialty);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: "Get the doctor record linked to a user account" })
  @ApiParam({ name: 'userId', format: 'uuid' })
  async getByUserId(@Param('userId', new ParseUUIDPipe()) userId: string) {
    const doctor = await this.doctors.findByUserId(userId);
    if (!doctor) throw new NotFoundException({ message: 'Doctor not found' });
    return doctor;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a doctor by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  async get(@Param('id', new ParseUUIDPipe()) id: string) {
    const doctor = await this.doctors.findById(id);
    if (!doctor) throw new NotFoundException({ message: 'Doctor not found' });
    return doctor;
  }

  @Post()
  @Roles('staff')
  @ApiOperation({
    summary: 'Create a doctor (staff only)',
    description:
      'Either link to an existing user (`user_id`) or supply `email`+`password` to auto-create the user account.',
  })
  create(@Body() dto: CreateDoctorDto) {
    return this.doctors.create(dto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update a doctor profile',
    description:
      'Doctors can update their own profile; staff can update any doctor.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 403, description: 'Doctors may only edit their own profile' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateDoctorDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    if (req.user.role === 'doctor' && req.user.doctorId !== id) {
      throw new ForbiddenException({
        success: false,
        message: 'You can only edit your own profile.',
      });
    }
    return this.doctors.update(id, dto);
  }

  @Delete(':id')
  @Roles('staff')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a doctor (staff only)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.doctors.remove(id);
  }
}
