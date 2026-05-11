import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Doctor } from '../doctors/doctor.entity';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { JwtPayload } from './jwt.strategy';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
  ) {}

  private invalid() {
    throw new UnauthorizedException({
      success: false,
      message: 'Invalid credentials.',
    });
  }

  /**
   * Verify credentials and issue a signed JWT.
   * @param dto Email/username + password.
   * @returns `{ success, message, data: { token, user } }` envelope on success.
   * @throws UnauthorizedException when the email is unknown or the password is wrong.
   */
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) this.invalid();

    const ok = await bcrypt.compare(dto.password, user!.password_hash);
    if (!ok) this.invalid();

    let doctorId: string | null = null;
    if (user!.role === 'doctor') {
      const doctor = await this.doctorRepo.findOne({
        where: { user_id: user!.user_id },
      });
      doctorId = doctor?.doctor_id ?? null;
    }

    const payload: JwtPayload = {
      userId: user!.user_id,
      email: user!.email,
      role: user!.role,
      fullName: user!.full_name || user!.email,
      doctorId,
    };

    return {
      success: true,
      message: 'Login successful.',
      data: {
        token: this.jwtService.sign(payload),
        user: {
          userId: user!.user_id,
          email: user!.email,
          username: user!.username ?? null,
          role: user!.role,
          fullName: user!.full_name || user!.email,
          doctorId,
        },
      },
    };
  }

  /**
   * Self-registration. Hashes the password with bcrypt and persists a new user.
   * @param dto Email, password, role, full name, optional username.
   * @returns Envelope with the freshly created user (no password hash).
   * @throws ConflictException if the email is already in use.
   */
  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException({
        success: false,
        message: 'Email already in use.',
      });
    }

    const password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const created = this.userRepo.create({
      email: dto.email,
      username: dto.username ?? dto.email,
      password_hash,
      role: dto.role,
      full_name: dto.fullName,
    });
    const saved = await this.userRepo.save(created);

    return {
      success: true,
      message: 'User registered successfully.',
      data: {
        userId: saved.user_id,
        email: saved.email,
        username: saved.username,
        role: saved.role,
        fullName: saved.full_name,
      },
    };
  }

  /**
   * Resolve the current user from a verified JWT payload, attaching the
   * doctor profile when the role is `doctor`.
   * @param payload Decoded JWT body produced by JwtStrategy.validate().
   * @returns Envelope with the user record + optional doctor profile.
   * @throws UnauthorizedException when the user no longer exists.
   */
  async getMe(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedException({
        success: false,
        message: 'User not found.',
      });
    }

    let doctorProfile: Doctor | null = null;
    if (user.role === 'doctor') {
      doctorProfile = await this.doctorRepo.findOne({
        where: { user_id: user.user_id },
      });
    }

    return {
      success: true,
      data: {
        userId: user.user_id,
        email: user.email,
        username: user.username,
        role: user.role,
        fullName: user.full_name,
        doctorProfile,
      },
    };
  }
}
