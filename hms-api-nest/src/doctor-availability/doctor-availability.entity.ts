import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'doctor_availability' })
@Index(['doctor_id', 'day_of_week', 'start_time'], { unique: true })
export class DoctorAvailability {
  @PrimaryGeneratedColumn({ name: 'availability_id' })
  availability_id: number;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctor_id: string;

  @Column({ name: 'day_of_week', type: 'int' })
  day_of_week: number;

  @Column({ name: 'start_time', type: 'time' })
  start_time: string;

  @Column({ name: 'end_time', type: 'time' })
  end_time: string;
}
