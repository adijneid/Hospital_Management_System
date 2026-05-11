import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type AppointmentStatus =
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'no_show';

@Entity({ name: 'appointments' })
export class Appointment {
  @PrimaryGeneratedColumn('uuid', { name: 'appointment_id' })
  appointment_id: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patient_id: string;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctor_id: string;

  @Column({ name: 'room_id', type: 'uuid', nullable: true })
  room_id: string | null;

  @Column({ name: 'scheduled_start', type: 'timestamptz' })
  scheduled_start: Date;

  @Column({ name: 'scheduled_end', type: 'timestamptz' })
  scheduled_end: Date;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled',
  })
  status: AppointmentStatus;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ name: 'created_by', type: 'uuid' })
  created_by: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @Column({ name: 'reminder_sent_at', type: 'timestamptz', nullable: true })
  reminder_sent_at: Date | null;
}
