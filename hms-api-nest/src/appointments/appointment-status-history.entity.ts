import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { AppointmentStatus } from './appointment.entity';

@Entity({ name: 'appointment_status_history' })
export class AppointmentStatusHistory {
  @PrimaryGeneratedColumn({ name: 'history_id' })
  history_id: number;

  @Column({ name: 'appointment_id', type: 'uuid' })
  appointment_id: string;

  @Column({
    name: 'old_status',
    type: 'enum',
    enum: ['scheduled', 'completed', 'cancelled', 'no_show'],
    nullable: true,
  })
  old_status: AppointmentStatus | null;

  @Column({
    name: 'new_status',
    type: 'enum',
    enum: ['scheduled', 'completed', 'cancelled', 'no_show'],
  })
  new_status: AppointmentStatus;

  @Column({ name: 'changed_by', type: 'uuid', nullable: true })
  changed_by: string | null;

  @CreateDateColumn({ name: 'changed_at', type: 'timestamptz' })
  changed_at: Date;
}
