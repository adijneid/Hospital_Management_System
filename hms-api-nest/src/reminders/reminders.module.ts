import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { Doctor } from '../doctors/doctor.entity';
import { Patient } from '../patients/patient.entity';
import { Room } from '../rooms/room.entity';
import { MailerService } from './mailer.service';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Patient, Doctor, Room])],
  controllers: [RemindersController],
  providers: [MailerService, RemindersService],
})
export class RemindersModule {}
