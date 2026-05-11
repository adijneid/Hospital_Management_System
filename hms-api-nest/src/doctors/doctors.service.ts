import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { applyChanges } from '../common/apply-changes';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { User } from '../users/user.entity';
import { Doctor } from './doctor.entity';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/doctor.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly repo: Repository<Doctor>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly gateway: RealtimeGateway,
  ) {}

  /** @returns All doctors sorted alphabetically by last then first name. */
  findAll() {
    return this.repo.find({
      order: { last_name: 'ASC', first_name: 'ASC' },
    });
  }

  /**
   * @param doctor_id UUID primary key.
   * @returns The doctor or `null`.
   */
  findById(doctor_id: string) {
    return this.repo.findOne({ where: { doctor_id } });
  }

  /**
   * @param user_id UUID of the linked user account.
   * @returns The doctor profile attached to that user, or `null`.
   */
  findByUserId(user_id: string) {
    return this.repo.findOne({ where: { user_id } });
  }

  /**
   * @param specialty Exact-match specialty name (e.g. "Cardiology").
   * @returns Matching doctors, alphabetically sorted.
   */
  findBySpecialty(specialty: string) {
    return this.repo.find({
      where: { specialty },
      order: { last_name: 'ASC', first_name: 'ASC' },
    });
  }

  /** @returns Total doctor count. */
  count() {
    return this.repo.count();
  }

  /**
   * Create a doctor in a single transaction. If `dto.user_id` is supplied
   * the doctor is linked to that user; otherwise `dto.email` + `dto.password`
   * are required and a `doctor`-role user is auto-created. Emits
   * `doctor.event` of type `created` on the realtime gateway.
   * @param dto Either include `user_id` to link, or `email`+`password` to provision.
   * @returns The persisted doctor row.
   * @throws BadRequestException when neither path's required fields are present.
   * @throws ConflictException when auto-create email is already taken.
   */
  async create(dto: CreateDoctorDto) {
    return this.dataSource.transaction(async (em) => {
      const userRepo = em.getRepository(User);
      const doctorRepo = em.getRepository(Doctor);

      let userId = dto.user_id ?? null;

      if (!userId) {
        if (!dto.email || !dto.password) {
          throw new BadRequestException({
            message:
              'Email and password are required to create a doctor account.',
          });
        }

        const existing = await userRepo.findOne({ where: { email: dto.email } });
        if (existing) {
          throw new ConflictException({
            message: 'A user with this email already exists.',
          });
        }

        const password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);
        const user = userRepo.create({
          email: dto.email,
          username: dto.email.split('@')[0],
          password_hash,
          role: 'doctor',
          full_name: `Dr. ${dto.first_name} ${dto.last_name}`,
        });
        const savedUser = await userRepo.save(user);
        userId = savedUser.user_id;
      }

      const doctor = doctorRepo.create({
        user_id: userId,
        first_name: dto.first_name,
        last_name: dto.last_name,
        specialty: dto.specialty,
        phone: dto.phone ?? null,
      });
      const saved = await doctorRepo.save(doctor);
      this.gateway.emitDoctorEvent({ type: 'created', doctor_id: saved.doctor_id });
      return saved;
    });
  }

  /**
   * Patch a doctor profile and keep the linked user's `full_name` in sync
   * when the name changes. Emits `doctor.event` of type `updated`.
   * @param doctor_id UUID of the doctor to update.
   * @param dto Subset of mutable fields.
   * @returns The updated doctor row.
   * @throws NotFoundException if the doctor does not exist.
   */
  async update(doctor_id: string, dto: UpdateDoctorDto) {
    const doctor = await this.findById(doctor_id);
    if (!doctor) throw new NotFoundException({ message: 'Doctor not found' });

    applyChanges(doctor, dto);
    const saved = await this.repo.save(doctor);

    if (saved.user_id && (dto.first_name || dto.last_name)) {
      await this.userRepo.update(
        { user_id: saved.user_id },
        { full_name: `Dr. ${saved.first_name} ${saved.last_name}` },
      );
    }
    this.gateway.emitDoctorEvent({ type: 'updated', doctor_id: saved.doctor_id });
    return saved;
  }

  /**
   * Hard-delete a doctor. Cascades to availability + appointments.
   * Emits `doctor.event` of type `deleted`.
   * @param doctor_id UUID of the doctor to remove.
   * @throws NotFoundException if no row matched.
   */
  async remove(doctor_id: string) {
    const result = await this.repo.delete({ doctor_id });
    if (!result.affected) {
      throw new NotFoundException({ message: 'Doctor not found' });
    }
    this.gateway.emitDoctorEvent({ type: 'deleted', doctor_id });
  }
}
