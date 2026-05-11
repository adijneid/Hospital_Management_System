import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { applyChanges } from '../common/apply-changes';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import {
  CreateRoomDto,
  UpdateRoomDto,
  UpdateRoomStatusDto,
} from './dto/room.dto';
import { Room, RoomStatus, RoomType } from './room.entity';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly repo: Repository<Room>,
    private readonly gateway: RealtimeGateway,
  ) {}

  /** @returns All rooms sorted by `room_number`. */
  findAll() {
    return this.repo.find({ order: { room_number: 'ASC' } });
  }

  /**
   * @param room_id UUID primary key.
   * @returns The room or `null`.
   */
  findById(room_id: string) {
    return this.repo.findOne({ where: { room_id } });
  }

  /**
   * @param room_number Human-readable room number (e.g. "203").
   * @returns Matching room or `null`.
   */
  findByNumber(room_number: string) {
    return this.repo.findOne({ where: { room_number } });
  }

  /**
   * @param room_type One of `consultation` | `treatment` | `surgery`.
   * @returns Rooms of that type, sorted by number.
   */
  findByType(room_type: RoomType) {
    return this.repo.find({
      where: { room_type },
      order: { room_number: 'ASC' },
    });
  }

  // -- Availability rule ------------------------------------------------
  // A room is "available" when, for the current day, it is not in
  // maintenance AND its booked appointment minutes (within the 07:00–19:00
  // working window) have not yet consumed all of its capacity slots.
  // Working window = 12 h = 720 min, so a room with capacity N has N × 720
  // room-minutes per day. Once booked_minutes ≥ N × 720 the room is fully
  // occupied today and is excluded from "available" listings.
  private static readonly BOOKED_TODAY_CTE = `
    WITH booked AS (
      SELECT a.room_id,
        SUM(EXTRACT(EPOCH FROM (
          LEAST(a.scheduled_end,   CURRENT_DATE + TIME '19:00')
        - GREATEST(a.scheduled_start, CURRENT_DATE + TIME '07:00')
        )) / 60.0) AS booked_minutes
      FROM appointments a
      WHERE a.status = 'scheduled'
        AND a.scheduled_start::date = CURRENT_DATE
        AND a.scheduled_end   > CURRENT_DATE + TIME '07:00'
        AND a.scheduled_start < CURRENT_DATE + TIME '19:00'
      GROUP BY a.room_id
    )
  `;
  private static readonly AVAILABLE_PREDICATE = `
    r.status != 'maintenance'
    AND COALESCE(b.booked_minutes, 0) < (r.capacity * 720)
  `;

  /**
   * Rooms not in maintenance whose booked minutes (07:00–19:00) have not yet
   * filled all of their capacity slots for today.
   * @returns Available rooms sorted by number.
   */
  findAvailable(): Promise<Room[]> {
    return this.repo.query(`
      ${RoomsService.BOOKED_TODAY_CTE}
      SELECT r.*
      FROM rooms r
      LEFT JOIN booked b ON b.room_id = r.room_id
      WHERE ${RoomsService.AVAILABLE_PREDICATE}
      ORDER BY r.room_number ASC;
    `);
  }

  /**
   * @param room_type Filter to one of `consultation` | `treatment` | `surgery`.
   * @returns Available rooms of that type sorted by number.
   */
  findAvailableByType(room_type: RoomType): Promise<Room[]> {
    return this.repo.query(
      `
      ${RoomsService.BOOKED_TODAY_CTE}
      SELECT r.*
      FROM rooms r
      LEFT JOIN booked b ON b.room_id = r.room_id
      WHERE ${RoomsService.AVAILABLE_PREDICATE}
        AND r.room_type = $1
      ORDER BY r.room_number ASC;
    `,
      [room_type],
    );
  }

  /**
   * @param floor Floor number (1, 2, 3, …).
   * @returns Rooms on that floor, sorted by number.
   */
  findByFloor(floor: number) {
    return this.repo.find({ where: { floor }, order: { room_number: 'ASC' } });
  }

  /** @returns Total room count. */
  count() {
    return this.repo.count();
  }

  /** @returns Number of rooms currently considered available (see `findAvailable`). */
  async countAvailable(): Promise<number> {
    const rows: { count: string }[] = await this.repo.query(`
      ${RoomsService.BOOKED_TODAY_CTE}
      SELECT COUNT(*) AS count
      FROM rooms r
      LEFT JOIN booked b ON b.room_id = r.room_id
      WHERE ${RoomsService.AVAILABLE_PREDICATE};
    `);
    return parseInt(rows[0].count, 10);
  }

  // Mirrors RoomRepository.countByStatus — total/available/occupied/maintenance
  // computed from today's scheduled appointments and capacity.
  /**
   * Status breakdown computed from today's `scheduled` appointments and
   * each room's capacity. Used by the staff dashboard.
   * @returns `{ total, available, occupied, maintenance }` counts.
   */
  async stats() {
    const row: {
      total: string;
      maintenance: string;
      occupied: string;
      available: string;
    } = await this.repo.query(`
      ${RoomsService.BOOKED_TODAY_CTE}
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE r.status = 'maintenance') AS maintenance,
        COUNT(*) FILTER (
          WHERE r.status != 'maintenance'
            AND COALESCE(b.booked_minutes, 0) >= (r.capacity * 720)
        ) AS occupied,
        COUNT(*) FILTER (WHERE ${RoomsService.AVAILABLE_PREDICATE}) AS available
      FROM rooms r
      LEFT JOIN booked b ON b.room_id = r.room_id;
    `).then((rows: any[]) => rows[0]);

    return {
      total: parseInt(row.total, 10),
      available: parseInt(row.available, 10),
      occupied: parseInt(row.occupied, 10),
      maintenance: parseInt(row.maintenance, 10),
    };
  }

  /**
   * Insert a new room and emit `room.event` of type `created`.
   * @param dto Room number, type, floor, capacity.
   * @returns The persisted room.
   */
  async create(dto: CreateRoomDto) {
    const room = this.repo.create(dto);
    const saved = await this.repo.save(room);
    this.gateway.emitRoomEvent({ type: 'created', room_id: saved.room_id, status: saved.status });
    return saved;
  }

  /**
   * Patch a room. Emits `status_changed` if the status changed, else `updated`.
   * @param room_id UUID.
   * @param dto Subset of mutable fields.
   * @returns Updated room.
   * @throws NotFoundException if the room does not exist.
   */
  async update(room_id: string, dto: UpdateRoomDto) {
    const room = await this.findById(room_id);
    if (!room) throw new NotFoundException({ message: 'Room not found' });
    const previousStatus = room.status;
    applyChanges(room, dto);
    const saved = await this.repo.save(room);
    this.gateway.emitRoomEvent({
      type: saved.status !== previousStatus ? 'status_changed' : 'updated',
      room_id: saved.room_id,
      status: saved.status,
    });
    return saved;
  }

  /**
   * Specialized variant of `update` that only changes the status field.
   * Emits `status_changed` only if the value actually changed.
   * @param room_id UUID.
   * @param dto `{ status: 'available' | 'occupied' | 'maintenance' }`.
   * @returns Updated room.
   * @throws NotFoundException if the room does not exist.
   */
  async updateStatus(room_id: string, dto: UpdateRoomStatusDto) {
    const room = await this.findById(room_id);
    if (!room) throw new NotFoundException({ message: 'Room not found' });
    const previousStatus = room.status;
    room.status = dto.status;
    const saved = await this.repo.save(room);
    if (saved.status !== previousStatus) {
      this.gateway.emitRoomEvent({
        type: 'status_changed',
        room_id: saved.room_id,
        status: saved.status,
      });
    }
    return saved;
  }

  /**
   * Hard-delete a room. Emits `room.event` of type `deleted`.
   * @param room_id UUID.
   * @throws NotFoundException if no row matched.
   */
  async remove(room_id: string) {
    const result = await this.repo.delete({ room_id });
    if (!result.affected) {
      throw new NotFoundException({ message: 'Room not found' });
    }
    this.gateway.emitRoomEvent({ type: 'deleted', room_id });
  }
}
