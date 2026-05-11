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
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
import { PatientsService } from './patients.service';

@ApiTags('patients')
@ApiBearerAuth('JWT')
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Get()
  @ApiOperation({ summary: 'List all patients' })
  list() {
    return this.patients.findAll();
  }

  @Get('count')
  @ApiOperation({ summary: 'Total patient count' })
  async getCount() {
    return { count: await this.patients.count() };
  }

  @Get('email')
  @ApiOperation({ summary: 'Find one patient by email' })
  @ApiQuery({ name: 'email', required: true })
  async getByEmail(@Query('email') email?: string) {
    if (!email) throw new BadRequestException({ message: 'Email is required' });
    const patient = await this.patients.findByEmail(email);
    if (!patient) throw new NotFoundException({ message: 'Patient not found' });
    return patient;
  }

  @Get('search')
  @ApiOperation({ summary: 'Search patients by name (first or last, case-insensitive)' })
  @ApiQuery({ name: 'name', required: true })
  search(@Query('name') name?: string) {
    if (!name) throw new BadRequestException({ message: 'Search name is required' });
    return this.patients.searchByName(name);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a patient by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async get(@Param('id', new ParseUUIDPipe()) id: string) {
    const patient = await this.patients.findById(id);
    if (!patient) throw new NotFoundException({ message: 'Patient not found' });
    return patient;
  }

  @Post()
  @Roles('staff')
  @ApiOperation({ summary: 'Create a new patient (staff only)' })
  create(
    @Body() dto: CreatePatientDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.patients.create(dto, req.user.userId);
  }

  @Put(':id')
  @Roles('staff')
  @ApiOperation({ summary: 'Update a patient (staff only)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patients.update(id, dto);
  }

  @Delete(':id')
  @Roles('staff')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a patient (staff only)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.patients.remove(id);
  }
}
