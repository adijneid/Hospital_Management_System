import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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
import type { AppointmentStatus } from './appointment.entity';
import { AppointmentsService } from './appointments.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  UpdateAppointmentStatusDto,
} from './dto/appointment.dto';

const STATUSES: AppointmentStatus[] = [
  'scheduled',
  'completed',
  'cancelled',
  'no_show',
];

@ApiTags('appointments')
@ApiBearerAuth('JWT')
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all appointments with patient/doctor/room joined in' })
  listWithDetails() {
    return this.appointments.findAllWithDetails();
  }

  @Get('raw')
  @ApiOperation({ summary: 'List all appointments without joins' })
  listRaw() {
    return this.appointments.findAll();
  }

  @Get('count')
  @ApiOperation({ summary: 'Total appointment count' })
  async getCount() {
    return { count: await this.appointments.count() };
  }

  @Get('scheduled/count')
  @ApiOperation({ summary: 'Count appointments in `scheduled` status' })
  async getScheduledCount() {
    return { count: await this.appointments.countScheduled() };
  }

  @Get('today')
  @ApiOperation({ summary: "Today's appointments (optionally filtered by doctor)" })
  @ApiQuery({ name: 'doctor_id', required: false, format: 'uuid' })
  today(@Query('doctor_id') doctorId?: string) {
    return this.appointments.findToday(doctorId ?? null);
  }

  @Get('status')
  @ApiOperation({ summary: 'Filter appointments by status' })
  @ApiQuery({ name: 'status', enum: STATUSES, required: true })
  byStatus(@Query('status') status?: string) {
    if (!status || !STATUSES.includes(status as AppointmentStatus)) {
      throw new BadRequestException({ message: 'Status is required' });
    }
    return this.appointments.findByStatus(status as AppointmentStatus);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'List appointments for a patient' })
  @ApiParam({ name: 'patientId', format: 'uuid' })
  byPatient(@Param('patientId', new ParseUUIDPipe()) patientId: string) {
    return this.appointments.findByPatient(patientId);
  }

  @Get('doctor/:doctorId/schedule')
  @ApiOperation({ summary: "A doctor's schedule between two dates" })
  @ApiParam({ name: 'doctorId', format: 'uuid' })
  @ApiQuery({ name: 'start_date', required: true, format: 'date' })
  @ApiQuery({ name: 'end_date', required: true, format: 'date' })
  doctorSchedule(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException({
        message: 'start_date and end_date are required',
      });
    }
    return this.appointments.findDoctorSchedule(doctorId, startDate, endDate);
  }

  @Get('doctor/:doctorId')
  @ApiOperation({ summary: 'List all appointments for a doctor' })
  @ApiParam({ name: 'doctorId', format: 'uuid' })
  byDoctor(@Param('doctorId', new ParseUUIDPipe()) doctorId: string) {
    return this.appointments.findByDoctor(doctorId);
  }

  @Get('doctor/:doctorId/patients')
  @ApiOperation({ summary: 'Distinct patients seen by a doctor' })
  @ApiParam({ name: 'doctorId', format: 'uuid' })
  doctorPatients(@Param('doctorId', new ParseUUIDPipe()) doctorId: string) {
    return this.appointments.findDoctorPatients(doctorId);
  }

  @Get('doctor/:doctorId/patient/:patientId/history')
  @ApiOperation({ summary: 'Visit history for a specific doctor + patient pair' })
  @ApiParam({ name: 'doctorId', format: 'uuid' })
  @ApiParam({ name: 'patientId', format: 'uuid' })
  doctorPatientHistory(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
  ) {
    return this.appointments.findDoctorPatientHistory(doctorId, patientId);
  }

  @Get('room/:roomId')
  @ApiOperation({ summary: 'Appointments scheduled in a room' })
  @ApiParam({ name: 'roomId', format: 'uuid' })
  byRoom(@Param('roomId', new ParseUUIDPipe()) roomId: string) {
    return this.appointments.findByRoom(roomId);
  }

  @Get('room/:roomId/schedule')
  @ApiOperation({ summary: "A room's upcoming schedule" })
  @ApiParam({ name: 'roomId', format: 'uuid' })
  roomSchedule(@Param('roomId', new ParseUUIDPipe()) roomId: string) {
    return this.appointments.findRoomSchedule(roomId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an appointment by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  get(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.appointments.findById(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Book a new appointment',
    description:
      'The service rejects time conflicts (same doctor/room overlapping another `scheduled` appointment) with HTTP 409.',
  })
  @ApiResponse({ status: 409, description: 'Time conflict — overlapping appointment' })
  create(
    @Body() dto: CreateAppointmentDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.appointments.create(dto, req.user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an appointment' })
  @ApiParam({ name: 'id', format: 'uuid' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointments.update(id, dto);
  }

  @Put(':id/status')
  @ApiOperation({
    summary: 'Transition an appointment to a new status',
    description: 'Writes a row to `appointment_status_history` for audit.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAppointmentStatusDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.appointments.updateStatus(id, dto, req.user.userId);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Audit trail of status changes for an appointment' })
  @ApiParam({ name: 'id', format: 'uuid' })
  history(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.appointments.findStatusHistory(id);
  }

  @Delete(':id')
  @Roles('staff')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an appointment (staff only)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.appointments.remove(id);
  }
}
