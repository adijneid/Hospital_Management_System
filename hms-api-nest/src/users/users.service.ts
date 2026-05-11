import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  /**
   * @returns All users, newest first.
   */
  findAll() {
    return this.repo.find({ order: { created_at: 'DESC' } });
  }

  /**
   * @param user_id UUID primary key.
   * @returns The user, or `null` if not found.
   */
  findById(user_id: string) {
    return this.repo.findOne({ where: { user_id } });
  }

  /**
   * Used by AuthService.login — accepts either a username or an email so
   * users can sign in with whichever they remember.
   * @param emailOrUsername Either `users.email` or `users.username`.
   * @returns Matching user or `null`.
   */
  findByEmail(emailOrUsername: string) {
    return this.repo
      .createQueryBuilder('u')
      .where('u.email = :v OR u.username = :v', { v: emailOrUsername })
      .getOne();
  }

  /**
   * Create a new user, hashing the supplied password with bcrypt.
   * @param dto Required: email, username, password, role, full_name.
   * @returns The persisted user (with `password_hash` for internal use; the
   *   controller serializer strips it before sending to the client).
   * @throws ConflictException if `dto.email` is already taken.
   */
  async create(dto: CreateUserDto) {
    const existing = await this.repo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use.');

    const password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = this.repo.create({
      email: dto.email,
      username: dto.username,
      password_hash,
      role: dto.role,
      full_name: dto.full_name,
    });
    return this.repo.save(user);
  }

  /**
   * Patch a user record with the supplied fields. Password updates go
   * through a dedicated route (not implemented here).
   * @param user_id UUID of the user to update.
   * @param dto Subset of mutable user fields.
   * @returns The updated user.
   * @throws NotFoundException if the user does not exist.
   */
  async update(user_id: string, dto: UpdateUserDto) {
    const user = await this.findById(user_id);
    if (!user) throw new NotFoundException('User not found.');
    Object.assign(user, dto);
    return this.repo.save(user);
  }

  /**
   * Hard-delete a user.
   * @param user_id UUID of the user to remove.
   * @throws NotFoundException if no row matched.
   */
  async remove(user_id: string) {
    const result = await this.repo.delete({ user_id });
    if (!result.affected) throw new NotFoundException('User not found.');
  }
}
