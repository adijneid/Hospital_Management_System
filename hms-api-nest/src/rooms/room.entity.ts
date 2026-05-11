import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type RoomType = 'consultation' | 'treatment' | 'surgery';
export type RoomStatus = 'available' | 'occupied' | 'maintenance';

@Entity({ name: 'rooms' })
export class Room {
  @PrimaryGeneratedColumn('uuid', { name: 'room_id' })
  room_id: string;

  @Column({ name: 'room_number', type: 'varchar', length: 20, unique: true })
  room_number: string;

  @Column({
    name: 'room_type',
    type: 'enum',
    enum: ['consultation', 'treatment', 'surgery'],
  })
  room_type: RoomType;

  @Column({ type: 'int' })
  floor: number;

  @Column({ type: 'int', default: 1 })
  capacity: number;

  @Column({
    type: 'enum',
    enum: ['available', 'occupied', 'maintenance'],
    default: 'available',
  })
  status: RoomStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;
}
