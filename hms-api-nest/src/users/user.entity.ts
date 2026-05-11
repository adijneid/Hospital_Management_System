import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type UserRole = 'staff' | 'doctor';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  user_id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @Exclude()
  @Column({ name: 'password_hash', type: 'text' })
  password_hash: string;

  @Column({ type: 'enum', enum: ['staff', 'doctor'], default: 'staff' })
  role: UserRole;

  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  full_name: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;
}
