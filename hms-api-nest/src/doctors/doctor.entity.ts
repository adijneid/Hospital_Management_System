import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity({ name: 'doctors' })
export class Doctor {
  @PrimaryGeneratedColumn('uuid', { name: 'doctor_id' })
  doctor_id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true, nullable: true })
  user_id: string | null;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  first_name: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  last_name: string;

  @Column({ type: 'varchar', length: 150 })
  specialty: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;
}
