import {
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
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { CreatePrescriptionDto, UpdatePrescriptionDto } from './dto/prescription.dto';
import { PrescriptionsService } from './prescriptions.service';

/**
 * Prescription endpoints. Reads are open to any authenticated user; writes
 * are locked to the appointment's owning doctor — only Dr. X can add or
 * remove prescriptions on Dr. X's appointments. Staff cannot prescribe.
 */
@ApiTags('prescriptions')
@ApiBearerAuth('JWT')
@Controller()
@UseGuards(JwtAuthGuard)
export class PrescriptionsController {
  constructor(private readonly rx: PrescriptionsService) {}

  @Get('appointments/:id/prescriptions')
  @ApiOperation({ summary: 'List prescriptions for an appointment' })
  @ApiParam({ name: 'id', format: 'uuid' })
  list(@Param('id', new ParseUUIDPipe()) appointmentId: string) {
    return this.rx.findByAppointment(appointmentId);
  }

  @Post('appointments/:id/prescriptions')
  @ApiOperation({
    summary: 'Add a prescription (owning doctor only)',
    description:
      "Only the doctor who owns the appointment may add prescriptions. Returns 403 otherwise.",
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 403, description: 'Not the owning doctor' })
  async create(
    @Param('id', new ParseUUIDPipe()) appointmentId: string,
    @Body() dto: CreatePrescriptionDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    await this.assertWriter(appointmentId, req.user);
    return this.rx.create(appointmentId, dto);
  }

  @Put('prescriptions/:rxId')
  @ApiOperation({ summary: 'Update a prescription (owning doctor only)' })
  @ApiParam({ name: 'rxId', format: 'uuid' })
  async update(
    @Param('rxId', new ParseUUIDPipe()) rxId: string,
    @Body() dto: UpdatePrescriptionDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const rx = await this.rx.findById(rxId);
    if (!rx) throw new NotFoundException({ message: 'Prescription not found' });
    await this.assertWriter(rx.appointment_id, req.user);
    return this.rx.update(rxId, dto);
  }

  @Delete('prescriptions/:rxId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a prescription (owning doctor only)' })
  @ApiParam({ name: 'rxId', format: 'uuid' })
  async remove(
    @Param('rxId', new ParseUUIDPipe()) rxId: string,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const rx = await this.rx.findById(rxId);
    if (!rx) return;
    await this.assertWriter(rx.appointment_id, req.user);
    return this.rx.remove(rxId);
  }

  @Get('appointments/:id/prescriptions.pdf')
  @ApiOperation({
    summary: 'Render prescriptions as a printable PDF',
    description: 'Returns `application/pdf` inline.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'PDF document',
    content: { 'application/pdf': {} },
  })
  async pdf(
    @Param('id', new ParseUUIDPipe()) appointmentId: string,
    @Res() res: Response,
  ) {
    const buf = await this.rx.generatePdf(appointmentId);
    res
      .setHeader('Content-Type', 'application/pdf')
      .setHeader(
        'Content-Disposition',
        `inline; filename="prescription-${appointmentId.slice(0, 8)}.pdf"`,
      )
      .setHeader('Content-Length', buf.length.toString())
      .end(buf);
  }

  private async assertWriter(appointmentId: string, user: JwtPayload) {
    const appt = await this.rx.ensureAppointmentExists(appointmentId);
    if (user.role !== 'doctor' || user.doctorId !== appt.doctor_id) {
      throw new ForbiddenException({
        success: false,
        message:
          'Only the doctor who owns this appointment can add or remove prescriptions.',
      });
    }
  }
}
