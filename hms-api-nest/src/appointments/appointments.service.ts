import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { AppointmentStatusHistory } from './appointment-status-history.entity';
import { Appointment, AppointmentStatus } from './appointment.entity';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  UpdateAppointmentStatusDto,
} from './dto/appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly repo: Repository<Appointment>,
    @InjectRepository(AppointmentStatusHistory)
    private readonly historyRepo: Repository<AppointmentStatusHistory>,
    private readonly gateway: RealtimeGateway,
  ) {}

  private logStatusChange(
    appointment_id: string,
    old_status: AppointmentStatus | null,
    new_status: AppointmentStatus,
    changed_by: string | null,
  ) {
    return this.historyRepo.save(
      this.historyRepo.create({
        appointment_id,
        old_status,
        new_status,
        changed_by,
      }),
    );
  }

  /**
   * Audit trail of every status transition for one appointment, newest first.
   * @param appointment_id UUID.
   * @returns Array of `appointment_status_history` rows.
   */
  findStatusHistory(appointment_id: string) {
    return this.historyRepo.find({
      where: { appointment_id },
      order: { changed_at: 'DESC' },
    });
  }

  /**
   * Paginated raw list of appointments with no joins.
   * @param limit Page size (default 100).
   * @param offset Rows to skip (default 0).
   * @returns Appointment rows ordered newest-start first.
   */
  findAll(limit = 100, offset = 0) {
    return this.repo.find({
      order: { scheduled_start: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Same as `findAll` but joins patient name, doctor name+specialty, room number.
   * @param limit Page size (default 100).
   * @param offset Rows to skip (default 0).
   * @returns Joined appointment rows ordered newest-start first.
   */
  findAllWithDetails(limit = 100, offset = 0) {
    return this.repo.query(
      `
      SELECT a.*,
             p.first_name || ' ' || p.last_name AS patient_name,
             d.first_name || ' ' || d.last_name AS doctor_name,
             d.specialty AS doctor_specialty,
             r.room_number
      FROM appointments a
      JOIN patients p ON p.patient_id = a.patient_id
      JOIN doctors  d ON d.doctor_id  = a.doctor_id
      LEFT JOIN rooms r ON r.room_id  = a.room_id
      ORDER BY a.scheduled_start DESC
      LIMIT $1 OFFSET $2;
      `,
      [limit, offset],
    );
  }

  /**
   * @param appointment_id UUID.
   * @returns The appointment or `null`.
   */
  findById(appointment_id: string) {
    return this.repo.findOne({ where: { appointment_id } });
  }

  /**
   * @param patient_id UUID of the patient.
   * @returns Up to 100 of that patient's appointments, newest-start first.
   */
  findByPatient(patient_id: string) {
    return this.repo.find({
      where: { patient_id },
      order: { scheduled_start: 'DESC' },
      take: 100,
    });
  }

  /**
   * @param doctor_id UUID of the doctor.
   * @returns Up to 100 of that doctor's appointments, newest-start first.
   */
  findByDoctor(doctor_id: string) {
    return this.repo.find({
      where: { doctor_id },
      order: { scheduled_start: 'DESC' },
      take: 100,
    });
  }

  /**
   * @param room_id UUID of the room.
   * @returns Up to 100 appointments scheduled in that room, newest-start first.
   */
  findByRoom(room_id: string) {
    return this.repo.find({
      where: { room_id },
      order: { scheduled_start: 'DESC' },
      take: 100,
    });
  }

  /**
   * @param status Filter value (`scheduled`, `completed`, `cancelled`, `no_show`).
   * @returns Up to 100 matching appointments, newest-start first.
   */
  findByStatus(status: AppointmentStatus) {
    return this.repo.find({
      where: { status },
      order: { scheduled_start: 'DESC' },
      take: 100,
    });
  }

  /**
   * Today's appointments via the `vw_todays_appointments` SQL view, which
   * joins patient/doctor names + specialty + room number for cheap reads.
   * @param doctor_id Optional UUID; when supplied, restricts to that doctor.
   * @returns View rows ordered by start time.
   */
  findToday(doctor_id: string | null) {
    if (doctor_id) {
      return this.repo.query(
        `SELECT * FROM vw_todays_appointments WHERE doctor_id = $1 ORDER BY scheduled_start;`,
        [doctor_id],
      );
    }
    return this.repo.query(
      `SELECT * FROM vw_todays_appointments ORDER BY scheduled_start;`,
    );
  }

  /**
   * Upcoming bookings for a room — `scheduled_end > NOW()` so currently-running
   * appointments stay visible until they finish.
   * @param room_id UUID.
   * @returns Joined appointment rows (incl. patient + doctor names) sorted asc.
   */
  findRoomSchedule(room_id: string) {
    // "Upcoming" = scheduled appointments whose end time hasn't passed.
    // Using `scheduled_end > NOW()` instead of `scheduled_start >= NOW()`
    // keeps currently-in-progress bookings visible (an appointment that
    // started 10 minutes ago and runs another 20 should still appear on
    // the room's schedule, not disappear the moment it begins).
    return this.repo.query(
      `
      SELECT a.*,
             p.first_name AS patient_first_name,
             p.last_name  AS patient_last_name,
             d.first_name AS doctor_first_name,
             d.last_name  AS doctor_last_name,
             d.specialty  AS doctor_specialty
      FROM appointments a
      JOIN patients p ON p.patient_id = a.patient_id
      JOIN doctors  d ON d.doctor_id  = a.doctor_id
      WHERE a.room_id = $1
        AND a.status = 'scheduled'
        AND a.scheduled_end > NOW()
      ORDER BY a.scheduled_start ASC;
      `,
      [room_id],
    );
  }

  /**
   * A doctor's `scheduled` appointments within a date range, joined with
   * patient name and room number.
   * @param doctor_id UUID of the doctor.
   * @param start_date Inclusive ISO date/datetime string.
   * @param end_date Inclusive ISO date/datetime string.
   * @returns Joined appointment rows ordered earliest-first.
   */
  findDoctorSchedule(doctor_id: string, start_date: string, end_date: string) {
    return this.repo.query(
      `
      SELECT a.*,
             p.first_name AS patient_first_name,
             p.last_name  AS patient_last_name,
             r.room_number
      FROM appointments a
      JOIN patients p ON p.patient_id = a.patient_id
      LEFT JOIN rooms r ON r.room_id = a.room_id
      WHERE a.doctor_id = $1
        AND a.scheduled_start >= $2
        AND a.scheduled_end <= $3
        AND a.status = 'scheduled'
      ORDER BY a.scheduled_start ASC;
      `,
      [doctor_id, start_date, end_date],
    );
  }

  /**
   * Distinct patients seen by a doctor, with visit_count and last_visit
   * computed via correlated subqueries. Drives the doctor's "My patients" view.
   * @param doctor_id UUID of the doctor.
   * @returns Patient rows enriched with `visit_count` and `last_visit`.
   */
  findDoctorPatients(doctor_id: string) {
    return this.repo.query(
      `
      SELECT DISTINCT ON (p.patient_id)
        p.patient_id, p.first_name, p.last_name, p.phone, p.email,
        p.blood_type, p.medical_notes, p.date_of_birth, p.gender,
        (SELECT COUNT(*) FROM appointments a2 WHERE a2.patient_id = p.patient_id AND a2.doctor_id = $1) AS visit_count,
        (SELECT MAX(a3.scheduled_start) FROM appointments a3 WHERE a3.patient_id = p.patient_id AND a3.doctor_id = $1) AS last_visit
      FROM appointments a
      JOIN patients p ON p.patient_id = a.patient_id
      WHERE a.doctor_id = $1
      ORDER BY p.patient_id, a.scheduled_start DESC;
      `,
      [doctor_id],
    );
  }

  /**
   * All visits between a specific doctor and patient pair, newest-first.
   * @param doctor_id UUID of the doctor.
   * @param patient_id UUID of the patient.
   * @returns Joined appointment rows with `room_number`.
   */
  findDoctorPatientHistory(doctor_id: string, patient_id: string) {
    return this.repo.query(
      `
      SELECT a.*,
             r.room_number
      FROM appointments a
      LEFT JOIN rooms r ON r.room_id = a.room_id
      WHERE a.doctor_id = $1 AND a.patient_id = $2
      ORDER BY a.scheduled_start DESC;
      `,
      [doctor_id, patient_id],
    );
  }

  /** @returns Total appointment row count across all statuses. */
  count() {
    return this.repo.count();
  }

  /** @returns Number of appointments still in `scheduled` status. */
  countScheduled() {
    return this.repo.count({ where: { status: 'scheduled' } });
  }

  // Doctor overlap check using tstzrange — port of AppointmentRepository.hasOverlap
  private async hasDoctorOverlap(
    doctor_id: string,
    start: string | Date,
    end: string | Date,
    exclude_appointment_id: string | null = null,
  ): Promise<boolean> {
    const params: any[] = [doctor_id, start, end];
    let sql = `
      SELECT COUNT(*)::int AS count FROM appointments
      WHERE doctor_id = $1
        AND status = 'scheduled'
        AND tstzrange(scheduled_start, scheduled_end, '[)') && tstzrange($2::timestamptz, $3::timestamptz, '[)')
    `;
    if (exclude_appointment_id) {
      sql += ' AND appointment_id != $4';
      params.push(exclude_appointment_id);
    }
    const rows: { count: number }[] = await this.repo.query(sql, params);
    return rows[0].count > 0;
  }

  private async isRoomAtCapacity(
    room_id: string,
    start: string | Date,
    end: string | Date,
    exclude_appointment_id: string | null = null,
  ): Promise<boolean> {
    const params: any[] = [room_id, start, end];
    let sql = `
      SELECT COUNT(*)::int AS count FROM appointments
      WHERE room_id = $1
        AND status = 'scheduled'
        AND tstzrange(scheduled_start, scheduled_end, '[)') && tstzrange($2::timestamptz, $3::timestamptz, '[)')
    `;
    if (exclude_appointment_id) {
      sql += ' AND appointment_id != $4';
      params.push(exclude_appointment_id);
    }
    const overlapRows: { count: number }[] = await this.repo.query(sql, params);
    const overlapping = overlapRows[0].count;

    const roomRows: { capacity: number }[] = await this.repo.query(
      'SELECT capacity FROM rooms WHERE room_id = $1',
      [room_id],
    );
    if (roomRows.length === 0) return true;
    return overlapping >= roomRows[0].capacity;
  }

  /**
   * Book a new appointment. Rejects with 409 if the doctor has an overlapping
   * `scheduled` appointment, or if the chosen room is already at capacity for
   * the requested window. On success: writes the first `appointment_status_history`
   * row and broadcasts `appointment.event` of type `created`.
   * @param dto Patient, doctor, optional room, time window, optional reason.
   * @param created_by `users.user_id` of the staff member booking the appointment.
   * @returns The persisted appointment.
   * @throws ConflictException on doctor overlap or room capacity overflow.
   */
  async create(dto: CreateAppointmentDto, created_by: string) {
    if (
      await this.hasDoctorOverlap(
        dto.doctor_id,
        dto.scheduled_start,
        dto.scheduled_end,
      )
    ) {
      throw new ConflictException({
        success: false,
        message:
          'This doctor already has an appointment at the selected time. Please choose a different doctor or time slot.',
      });
    }

    if (
      dto.room_id &&
      (await this.isRoomAtCapacity(
        dto.room_id,
        dto.scheduled_start,
        dto.scheduled_end,
      ))
    ) {
      throw new ConflictException({
        success: false,
        message:
          'This room is at full capacity for the selected time. Please choose a different room or time slot.',
      });
    }

    const appointment = this.repo.create({
      patient_id: dto.patient_id,
      doctor_id: dto.doctor_id,
      room_id: dto.room_id ?? null,
      scheduled_start: new Date(dto.scheduled_start),
      scheduled_end: new Date(dto.scheduled_end),
      reason: dto.reason ?? null,
      created_by,
    });
    const saved = await this.repo.save(appointment);
    await this.logStatusChange(saved.appointment_id, null, saved.status, created_by);
    this.gateway.emitAppointmentEvent({
      type: 'created',
      appointment_id: saved.appointment_id,
      doctor_id: saved.doctor_id,
      patient_id: saved.patient_id,
      status: saved.status,
      changed_by: created_by,
    });
    return saved;
  }

  /**
   * Patch an existing appointment. When the time window changes, re-validates
   * doctor overlap and room capacity. Logs a `status_history` row when the
   * status changes, and broadcasts an `updated` (or `status_changed`) event.
   * @param appointment_id UUID.
   * @param dto Subset of mutable fields.
   * @returns The updated appointment.
   * @throws NotFoundException if the appointment does not exist.
   * @throws ConflictException on doctor overlap or room capacity overflow.
   */
  async update(appointment_id: string, dto: UpdateAppointmentDto) {
    const current = await this.findById(appointment_id);
    if (!current) {
      throw new NotFoundException({ message: 'Appointment not found' });
    }

    const effectiveDoctorId = dto.doctor_id ?? current.doctor_id;
    const effectiveStart = dto.scheduled_start ?? current.scheduled_start;
    const effectiveEnd = dto.scheduled_end ?? current.scheduled_end;

    if (dto.scheduled_start && dto.scheduled_end) {
      if (
        await this.hasDoctorOverlap(
          effectiveDoctorId,
          effectiveStart,
          effectiveEnd,
          appointment_id,
        )
      ) {
        throw new ConflictException({
          success: false,
          message:
            'This doctor already has an appointment at the selected time. Please choose a different doctor or time slot.',
        });
      }

      if (
        dto.room_id &&
        (await this.isRoomAtCapacity(
          dto.room_id,
          effectiveStart,
          effectiveEnd,
          appointment_id,
        ))
      ) {
        throw new ConflictException({
          success: false,
          message:
            'This room is at full capacity for the selected time. Please choose a different room or time slot.',
        });
      }
    }

    const previousStatus = current.status;
    Object.assign(current, {
      patient_id: dto.patient_id ?? current.patient_id,
      doctor_id: effectiveDoctorId,
      room_id: dto.room_id !== undefined ? dto.room_id : current.room_id,
      scheduled_start:
        dto.scheduled_start !== undefined
          ? new Date(dto.scheduled_start)
          : current.scheduled_start,
      scheduled_end:
        dto.scheduled_end !== undefined
          ? new Date(dto.scheduled_end)
          : current.scheduled_end,
      status: dto.status ?? current.status,
      reason: dto.reason !== undefined ? dto.reason : current.reason,
    });
    const saved = await this.repo.save(current);
    if (saved.status !== previousStatus) {
      await this.logStatusChange(saved.appointment_id, previousStatus, saved.status, null);
    }
    this.gateway.emitAppointmentEvent({
      type: saved.status !== previousStatus ? 'status_changed' : 'updated',
      appointment_id: saved.appointment_id,
      doctor_id: saved.doctor_id,
      patient_id: saved.patient_id,
      status: saved.status,
    });
    return saved;
  }

  /**
   * Transition an appointment to a new status, log the change in
   * `appointment_status_history`, and broadcast `status_changed`.
   * @param appointment_id UUID.
   * @param dto `{ status: 'scheduled' | 'completed' | 'cancelled' | 'no_show' }`.
   * @param changed_by Optional `users.user_id` for the audit row (null for system).
   * @returns The updated appointment.
   * @throws NotFoundException if the appointment does not exist.
   */
  async updateStatus(
    appointment_id: string,
    dto: UpdateAppointmentStatusDto,
    changed_by: string | null = null,
  ) {
    const current = await this.findById(appointment_id);
    if (!current) {
      throw new NotFoundException({ message: 'Appointment not found' });
    }
    const previousStatus = current.status;
    current.status = dto.status;
    const saved = await this.repo.save(current);
    if (saved.status !== previousStatus) {
      await this.logStatusChange(saved.appointment_id, previousStatus, saved.status, changed_by);
      this.gateway.emitAppointmentEvent({
        type: 'status_changed',
        appointment_id: saved.appointment_id,
        doctor_id: saved.doctor_id,
        patient_id: saved.patient_id,
        status: saved.status,
        changed_by,
      });
    }
    return saved;
  }

  /**
   * Hard-delete an appointment. Cascades to status history + prescriptions.
   * Broadcasts `appointment.event` of type `deleted`.
   * @param appointment_id UUID.
   * @throws NotFoundException if no row matched.
   */
  async remove(appointment_id: string) {
    const result = await this.repo.delete({ appointment_id });
    if (!result.affected) {
      throw new NotFoundException({ message: 'Appointment not found' });
    }
    this.gateway.emitAppointmentEvent({
      type: 'deleted',
      appointment_id,
    });
  }
}
