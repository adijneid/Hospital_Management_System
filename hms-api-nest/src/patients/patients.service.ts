import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { applyChanges } from '../common/apply-changes';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
import { Patient } from './patient.entity';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly repo: Repository<Patient>,
  ) {}

  /**
   * Paginated list of patients ordered alphabetically by last then first name.
   * @param limit Page size (default 100).
   * @param offset Rows to skip (default 0).
   * @returns Array of patient records.
   */
  findAll(limit = 100, offset = 0) {
    return this.repo.find({
      order: { last_name: 'ASC', first_name: 'ASC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * @param patient_id UUID primary key.
   * @returns The matching patient or `null`.
   */
  findById(patient_id: string) {
    return this.repo.findOne({ where: { patient_id } });
  }

  /**
   * @param email Exact-match email address.
   * @returns The matching patient or `null`.
   */
  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  /**
   * Case-insensitive partial match on either first or last name.
   * @param name Substring to match.
   * @param limit Page size (default 100).
   * @param offset Rows to skip (default 0).
   * @returns Array of matching patients sorted alphabetically.
   */
  searchByName(name: string, limit = 100, offset = 0) {
    return this.repo.find({
      where: [
        { first_name: ILike(`%${name}%`) },
        { last_name: ILike(`%${name}%`) },
      ],
      order: { last_name: 'ASC', first_name: 'ASC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * @returns Total number of patient rows.
   */
  count() {
    return this.repo.count();
  }

  /**
   * Insert a new patient.
   * @param dto Required name/dob/gender/phone + optional email/address/blood_type/medical_notes.
   * @param created_by `users.user_id` of the staff member creating the record.
   * @returns The persisted patient row.
   */
  create(dto: CreatePatientDto, created_by: string) {
    const patient = this.repo.create({
      ...dto,
      email: dto.email ?? null,
      address: dto.address ?? null,
      blood_type: dto.blood_type ?? null,
      medical_notes: dto.medical_notes ?? null,
      created_by,
    });
    return this.repo.save(patient);
  }

  /**
   * Patch a patient record with non-null fields from `dto`.
   * @param patient_id UUID of the patient to update.
   * @param dto Subset of mutable fields.
   * @returns The updated patient.
   * @throws NotFoundException if the patient does not exist.
   */
  async update(patient_id: string, dto: UpdatePatientDto) {
    const patient = await this.findById(patient_id);
    if (!patient) throw new NotFoundException({ message: 'Patient not found' });
    applyChanges(patient, dto);
    return this.repo.save(patient);
  }

  /**
   * Hard-delete a patient. Cascades to appointments via FK constraint.
   * @param patient_id UUID to delete.
   * @throws NotFoundException if no row matched.
   */
  async remove(patient_id: string) {
    const result = await this.repo.delete({ patient_id });
    if (!result.affected) {
      throw new NotFoundException({ message: 'Patient not found' });
    }
  }
}
