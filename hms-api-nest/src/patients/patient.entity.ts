import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type Gender = 'Male' | 'Female' | 'Other';

@Entity({ name: 'patients' })
export class Patient {
  @PrimaryGeneratedColumn('uuid', { name: 'patient_id' })
  patient_id: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  first_name: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  last_name: string;

  @Column({ name: 'date_of_birth', type: 'date' })
  date_of_birth: string;

  @Column({ type: 'enum', enum: ['Male', 'Female', 'Other'] })
  gender: Gender;

  @Column({ type: 'varchar', length: 30 })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ name: 'blood_type', type: 'varchar', length: 5, nullable: true })
  blood_type: string | null;

  @Column({ name: 'medical_notes', type: 'text', nullable: true })
  medical_notes: string | null;

  @Column({ name: 'created_by', type: 'uuid' })
  created_by: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;
}
