import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { Doctor } from '../doctors/doctor.entity';
import { Patient } from '../patients/patient.entity';
import { Room } from '../rooms/room.entity';
import { MailerService } from './mailer.service';

/**
 * Sends 24-hour-out email reminders for scheduled appointments.
 *
 * Cron: every 5 minutes scan for appointments whose `scheduled_start` falls
 * inside the [now, now+24h] window, status='scheduled', `reminder_sent_at`
 * IS NULL, and whose patient has an email on file. For each, build the email
 * and on successful send, stamp `reminder_sent_at = NOW()`.
 *
 * Manual: `sendReminder(appointment_id, force?)` is exposed via the
 * controller's `POST /api/appointments/:id/send-reminder` route. `force=true`
 * resends even if `reminder_sent_at` is already set.
 */
@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
    @InjectRepository(Appointment)
    private readonly apptRepo: Repository<Appointment>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
  ) {}

  /**
   * Cron entry point: every 5 minutes scan for due reminders and send them.
   * Backed by the `idx_appointments_reminder_due` partial index (migration 004).
   */
  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'reminder-sweep' })
  async runScheduledReminders() {
    if (!this.mailer.isReady()) return;

    const horizonHours = parseInt(
      this.config.get<string>('REMINDER_HORIZON_HOURS') ?? '24',
      10,
    );

    const due = await this.apptRepo
      .createQueryBuilder('a')
      .where("a.status = 'scheduled'")
      .andWhere('a.reminder_sent_at IS NULL')
      .andWhere('a.scheduled_start > NOW()')
      .andWhere(
        `a.scheduled_start <= NOW() + (INTERVAL '1 hour' * :h)`,
        { h: horizonHours },
      )
      .orderBy('a.scheduled_start', 'ASC')
      .getMany();

    if (!due.length) return;

    this.logger.log(`Reminder sweep: ${due.length} due appointment(s)`);
    for (const appt of due) {
      try {
        await this.sendReminder(appt.appointment_id, false);
      } catch (err) {
        this.logger.warn(
          `Reminder send failed for ${appt.appointment_id}: ${(err as Error).message}`,
        );
      }
    }
  }

  /**
   * Send (or re-send) the reminder email for one appointment.
   * @param appointment_id UUID.
   * @param force When true, bypasses the "already sent" guard (default false).
   * @returns `{ status: 'sent', previewUrl }` on success, or `{ status: 'skipped', reason }`
   *   when the reminder was suppressed (already sent, no patient email, mailer down,
   *   or appointment not in `scheduled` status).
   * @throws NotFoundException if the appointment does not exist.
   */
  async sendReminder(
    appointment_id: string,
    force = false,
  ): Promise<{ status: 'sent' | 'skipped'; reason?: string; previewUrl?: string | null }> {
    const appt = await this.apptRepo.findOne({ where: { appointment_id } });
    if (!appt) throw new NotFoundException({ message: 'Appointment not found' });

    if (!force && appt.reminder_sent_at) {
      return { status: 'skipped', reason: 'Reminder already sent for this appointment.' };
    }
    if (appt.status !== 'scheduled') {
      return { status: 'skipped', reason: `Appointment is ${appt.status}, not scheduled.` };
    }
    if (!this.mailer.isReady()) {
      return { status: 'skipped', reason: 'Mailer not configured.' };
    }

    const [patient, doctor, room] = await Promise.all([
      this.patientRepo.findOne({ where: { patient_id: appt.patient_id } }),
      this.doctorRepo.findOne({ where: { doctor_id: appt.doctor_id } }),
      appt.room_id
        ? this.roomRepo.findOne({ where: { room_id: appt.room_id } })
        : Promise.resolve(null),
    ]);

    if (!patient?.email) {
      return { status: 'skipped', reason: 'Patient has no email on file.' };
    }

    const html = renderReminderHtml({ appt, patient, doctor, room });
    const text = renderReminderText({ appt, patient, doctor, room });

    const result = await this.mailer.sendMail({
      to: patient.email,
      subject: `Appointment reminder — ${formatDateTime(appt.scheduled_start)}`,
      html,
      text,
    });

    appt.reminder_sent_at = new Date();
    await this.apptRepo.save(appt);

    this.logger.log(
      `Reminder sent for ${appt.appointment_id} to ${patient.email}` +
        (result.previewUrl ? ` (preview: ${result.previewUrl})` : ''),
    );
    return { status: 'sent', previewUrl: result.previewUrl };
  }
}

// ── helpers ──────────────────────────────────────────────────────────────

function formatDateTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function renderReminderHtml(args: {
  appt: Appointment;
  patient: Patient;
  doctor: Doctor | null;
  room: Room | null;
}): string {
  const { appt, patient, doctor, room } = args;
  const doctorLine = doctor
    ? `Dr. ${doctor.first_name} ${doctor.last_name} — ${doctor.specialty}`
    : '';
  const roomLine = room ? `Room ${room.room_number}` : '';
  return `
<!doctype html>
<html><body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,'Segoe UI',sans-serif;color:#111827;">
  <div style="max-width:560px;margin:32px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
    <div style="background:#2563eb;color:white;padding:24px 28px;">
      <h1 style="margin:0;font-size:20px;">HMS — Hospital Management System</h1>
      <p style="margin:6px 0 0 0;opacity:0.85;font-size:13px;">University of Balamand Medical Center</p>
    </div>
    <div style="padding:24px 28px;">
      <p style="margin:0 0 16px 0;font-size:16px;">Hello ${escape(patient.first_name)},</p>
      <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#374151;">
        This is a friendly reminder of your upcoming appointment.
      </p>
      <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:8px 0;color:#6b7280;width:130px;">When</td>
            <td style="padding:8px 0;font-weight:600;">${escape(formatDateTime(appt.scheduled_start))}</td></tr>
        ${doctorLine ? `<tr><td style="padding:8px 0;color:#6b7280;">Doctor</td>
            <td style="padding:8px 0;font-weight:600;">${escape(doctorLine)}</td></tr>` : ''}
        ${roomLine ? `<tr><td style="padding:8px 0;color:#6b7280;">Location</td>
            <td style="padding:8px 0;font-weight:600;">${escape(roomLine)}</td></tr>` : ''}
        ${appt.reason ? `<tr><td style="padding:8px 0;color:#6b7280;">Reason</td>
            <td style="padding:8px 0;">${escape(appt.reason)}</td></tr>` : ''}
      </table>
      <p style="margin:0 0 8px 0;font-size:13px;color:#374151;line-height:1.6;">
        Please arrive 10 minutes early. If you need to reschedule or cancel,
        contact reception at <a href="tel:+9611000000" style="color:#2563eb;">+961-1-000-000</a>.
      </p>
    </div>
    <div style="padding:14px 28px;background:#f9fafb;font-size:11px;color:#9ca3af;">
      Automated message from the HMS reminder service. Please do not reply.
    </div>
  </div>
</body></html>`.trim();
}

function renderReminderText(args: {
  appt: Appointment;
  patient: Patient;
  doctor: Doctor | null;
  room: Room | null;
}): string {
  const { appt, patient, doctor, room } = args;
  const lines = [
    `Hello ${patient.first_name},`,
    '',
    'This is a friendly reminder of your upcoming appointment:',
    '',
    `  When:     ${formatDateTime(appt.scheduled_start)}`,
  ];
  if (doctor)
    lines.push(`  Doctor:   Dr. ${doctor.first_name} ${doctor.last_name} (${doctor.specialty})`);
  if (room) lines.push(`  Location: Room ${room.room_number}`);
  if (appt.reason) lines.push(`  Reason:   ${appt.reason}`);
  lines.push(
    '',
    'Please arrive 10 minutes early. To reschedule or cancel, call +961-1-000-000.',
    '',
    '— HMS, University of Balamand Medical Center',
  );
  return lines.join('\n');
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
