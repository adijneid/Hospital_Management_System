import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'prescriptions' })
export class Prescription {
  @PrimaryGeneratedColumn('uuid', { name: 'prescription_id' })
  prescription_id: string;

  @Column({ name: 'appointment_id', type: 'uuid' })
  appointment_id: string;

  @Column({ type: 'varchar', length: 200 })
  medication: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  dosage: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  frequency: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  duration: string | null;

  @Column({ type: 'text', nullable: true })
  instructions: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;
}
