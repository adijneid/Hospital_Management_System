import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PDFDocument = require('pdfkit');
import { Repository } from 'typeorm';
import { AppointmentsService } from '../appointments/appointments.service';
import { applyChanges } from '../common/apply-changes';
import { DoctorsService } from '../doctors/doctors.service';
import { PatientsService } from '../patients/patients.service';
import { CreatePrescriptionDto, UpdatePrescriptionDto } from './dto/prescription.dto';
import { Prescription } from './prescription.entity';

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectRepository(Prescription)
    private readonly repo: Repository<Prescription>,
    private readonly appts: AppointmentsService,
    private readonly patients: PatientsService,
    private readonly doctors: DoctorsService,
  ) {}

  /**
   * Used by the controller's authorization guard to confirm the appointment
   * exists before checking ownership.
   * @param appointment_id UUID.
   * @returns The appointment row.
   * @throws NotFoundException if no row matched.
   */
  async ensureAppointmentExists(appointment_id: string) {
    const appt = await this.appts.findById(appointment_id);
    if (!appt) throw new NotFoundException({ message: 'Appointment not found' });
    return appt;
  }

  /**
   * @param appointment_id UUID.
   * @returns Prescription rows for that appointment, oldest-first.
   */
  findByAppointment(appointment_id: string) {
    return this.repo.find({
      where: { appointment_id },
      order: { created_at: 'ASC' },
    });
  }

  /**
   * @param prescription_id UUID.
   * @returns The prescription or `null`.
   */
  findById(prescription_id: string) {
    return this.repo.findOne({ where: { prescription_id } });
  }

  /**
   * Attach a new prescription to an appointment.
   * @param appointment_id UUID of the parent appointment.
   * @param dto medication + optional dosage/frequency/duration/instructions.
   * @returns The persisted prescription.
   * @throws NotFoundException if the appointment does not exist.
   */
  async create(appointment_id: string, dto: CreatePrescriptionDto) {
    await this.ensureAppointmentExists(appointment_id);
    const rx = this.repo.create({ appointment_id, ...dto });
    return this.repo.save(rx);
  }

  /**
   * Patch a prescription with the supplied fields.
   * @param prescription_id UUID.
   * @param dto Subset of mutable fields.
   * @returns Updated prescription.
   * @throws NotFoundException if the prescription does not exist.
   */
  async update(prescription_id: string, dto: UpdatePrescriptionDto) {
    const rx = await this.findById(prescription_id);
    if (!rx) {
      throw new NotFoundException({ message: 'Prescription not found' });
    }
    applyChanges(rx, dto);
    return this.repo.save(rx);
  }

  /**
   * Hard-delete a prescription.
   * @param prescription_id UUID.
   * @throws NotFoundException if no row matched.
   */
  async remove(prescription_id: string) {
    const result = await this.repo.delete({ prescription_id });
    if (!result.affected) {
      throw new NotFoundException({ message: 'Prescription not found' });
    }
  }

  /**
   * Build a printable PDF for the appointment's prescriptions.
   * @param appointment_id UUID of the appointment.
   * @returns A Buffer containing the rendered PDF document. The controller
   *   is responsible for setting Content-Type / Content-Disposition headers.
   * @throws NotFoundException if the appointment does not exist.
   */
  async generatePdf(appointment_id: string): Promise<Buffer> {
    const appt = await this.ensureAppointmentExists(appointment_id);
    const [patient, doctor, items] = await Promise.all([
      this.patients.findById(appt.patient_id),
      this.doctors.findById(appt.doctor_id),
      this.findByAppointment(appointment_id),
    ]);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // ── Header / letterhead ────────────────────────────────────────────
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#2563eb')
      .text('HMS — Hospital Management System', { align: 'center' });
    doc
      .moveDown(0.2)
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#6b7280')
      .text('University of Balamand Medical Center', { align: 'center' })
      .text('+961-1-000-000  ·  reception@hms.lb', { align: 'center' });

    doc
      .moveDown(0.6)
      .strokeColor('#e5e7eb')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();

    // ── Title ──────────────────────────────────────────────────────────
    doc
      .moveDown(1.0)
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#111827')
      .text('Prescription', { align: 'left' });

    // ── Meta block: patient | doctor | date ────────────────────────────
    const labelStyle = (s: string) =>
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#6b7280').text(s);
    const valueStyle = (s: string) =>
      doc.font('Helvetica').fontSize(11).fillColor('#111827').text(s);

    doc.moveDown(0.6);
    const metaTop = doc.y;
    const colW = 165;
    const left = 50;

    // col 1 — patient
    doc.text('', left, metaTop);
    labelStyle('PATIENT');
    valueStyle(patient
      ? `${patient.first_name} ${patient.last_name}`
      : '(unknown)');
    if (patient) {
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#6b7280')
        .text(`DOB: ${formatDate(patient.date_of_birth)}  ·  ${patient.gender}`);
    }

    // col 2 — doctor
    doc.text('', left + colW, metaTop);
    labelStyle('DOCTOR');
    valueStyle(doctor
      ? `Dr. ${doctor.first_name} ${doctor.last_name}`
      : '(unknown)');
    if (doctor) {
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#6b7280')
        .text(doctor.specialty);
    }

    // col 3 — visit date
    doc.text('', left + colW * 2, metaTop);
    labelStyle('VISIT DATE');
    valueStyle(formatDateTime(appt.scheduled_start));

    // reset cursor below the columns
    doc.text('', left, metaTop + 60);

    // ── Rx items ───────────────────────────────────────────────────────
    doc
      .moveDown(0.8)
      .strokeColor('#e5e7eb')
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke()
      .moveDown(0.4);

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#111827')
      .text('℞  Medications')
      .moveDown(0.4);

    if (items.length === 0) {
      doc
        .font('Helvetica-Oblique')
        .fontSize(10)
        .fillColor('#9ca3af')
        .text('No medications prescribed for this visit.');
    } else {
      items.forEach((rx, i) => {
        doc
          .moveDown(0.3)
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor('#111827')
          .text(`${i + 1}. ${rx.medication}`);

        const meta = [
          rx.dosage && `Dosage: ${rx.dosage}`,
          rx.frequency && `Frequency: ${rx.frequency}`,
          rx.duration && `Duration: ${rx.duration}`,
        ]
          .filter(Boolean)
          .join('   ·   ');
        if (meta) {
          doc
            .font('Helvetica')
            .fontSize(10)
            .fillColor('#374151')
            .text('   ' + meta);
        }
        if (rx.instructions) {
          doc
            .font('Helvetica-Oblique')
            .fontSize(9.5)
            .fillColor('#4b5563')
            .text(`   Instructions: ${rx.instructions}`);
        }
      });
    }

    // ── Signature ──────────────────────────────────────────────────────
    doc
      .moveDown(2)
      .strokeColor('#9ca3af')
      .lineWidth(0.5)
      .moveTo(350, doc.y)
      .lineTo(545, doc.y)
      .stroke();
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#6b7280')
      .text('Doctor Signature', 350, doc.y + 4);

    if (doctor) {
      doc
        .moveDown(0.4)
        .text(`Dr. ${doctor.first_name} ${doctor.last_name}, ${doctor.specialty}`, 350);
    }

    // ── Footer ────────────────────────────────────────────────────────
    const footY = doc.page.height - 60;
    doc
      .fontSize(8)
      .fillColor('#9ca3af')
      .text(
        'This prescription is generated by the HMS system. Keep for your records. Do not share with unauthorized persons.',
        50,
        footY,
        { align: 'center', width: 495 },
      )
      .text(`Generated ${new Date().toISOString()}`, { align: 'center' });

    doc.end();
    return done;
  }
}

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

function formatDateTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date
    .toISOString()
    .replace('T', ' ')
    .slice(0, 16);
}
