import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { AuthModule } from '../auth/auth.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { PatientsModule } from '../patients/patients.module';
import { RoomsModule } from '../rooms/rooms.module';
import { AppointmentsResolver } from './appointments/appointments.resolver';
import { DashboardResolver } from './dashboard/dashboard.resolver';
import { DoctorsResolver } from './doctors/doctors.resolver';
import { PatientsResolver } from './patients/patients.resolver';
import { RoomsResolver } from './rooms/rooms.resolver';

@Module({
  imports: [
    AuthModule,
    AppointmentsModule,
    DoctorsModule,
    PatientsModule,
    RoomsModule,
  ],
  providers: [
    DashboardResolver,
    AppointmentsResolver,
    PatientsResolver,
    DoctorsResolver,
    RoomsResolver,
  ],
})
export class GraphqlFeatureModule {}
