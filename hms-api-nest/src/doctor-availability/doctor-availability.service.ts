import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorAvailability } from './doctor-availability.entity';
import {
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
} from './dto/availability.dto';

@Injectable()
export class DoctorAvailabilityService {
  constructor(
    @InjectRepository(DoctorAvailability)
    private readonly repo: Repository<DoctorAvailability>,
  ) {}

  /** @returns All availability slots, grouped by doctor → day → start time. */
  findAll() {
    return this.repo.find({
      order: { doctor_id: 'ASC', day_of_week: 'ASC', start_time: 'ASC' },
    });
  }

  /**
   * @param availability_id Serial primary key.
   * @returns The slot or `null`.
   */
  findById(availability_id: number) {
    return this.repo.findOne({ where: { availability_id } });
  }

  /**
   * @param doctor_id UUID of the doctor.
   * @returns All weekly availability rows for that doctor, ordered by day + time.
   */
  findByDoctor(doctor_id: string) {
    return this.repo.find({
      where: { doctor_id },
      order: { day_of_week: 'ASC', start_time: 'ASC' },
    });
  }

  /**
   * @param doctor_id UUID of the doctor.
   * @param day_of_week 0=Sunday … 6=Saturday.
   * @returns Slots on that weekday for the doctor, ordered by start time.
   */
  findByDoctorAndDay(doctor_id: string, day_of_week: number) {
    return this.repo.find({
      where: { doctor_id, day_of_week },
      order: { start_time: 'ASC' },
    });
  }

  /**
   * Insert a new availability slot.
   * @param dto Doctor id, day of week, start_time, end_time.
   * @returns The persisted slot.
   */
  create(dto: CreateAvailabilityDto) {
    const slot = this.repo.create(dto);
    return this.repo.save(slot);
  }

  /**
   * Patch a slot.
   * @param availability_id Serial primary key.
   * @param dto Subset of mutable fields.
   * @returns Updated slot.
   * @throws NotFoundException if no row matched.
   */
  async update(availability_id: number, dto: UpdateAvailabilityDto) {
    const slot = await this.findById(availability_id);
    if (!slot) {
      throw new NotFoundException({ message: 'Availability slot not found' });
    }
    Object.assign(slot, dto);
    return this.repo.save(slot);
  }

  /**
   * Hard-delete one slot.
   * @param availability_id Serial primary key.
   * @throws NotFoundException if no row matched.
   */
  async remove(availability_id: number) {
    const result = await this.repo.delete({ availability_id });
    if (!result.affected) {
      throw new NotFoundException({ message: 'Availability slot not found' });
    }
  }

  /**
   * Wipe a doctor's entire weekly schedule.
   * @param doctor_id UUID of the doctor.
   * @throws NotFoundException if the doctor had no rows (treated as "not found").
   */
  async removeAllForDoctor(doctor_id: string) {
    const result = await this.repo.delete({ doctor_id });
    if (!result.affected) {
      throw new NotFoundException({ message: 'Doctor not found' });
    }
  }
}
