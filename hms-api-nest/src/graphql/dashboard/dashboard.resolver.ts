import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { AppointmentsService } from '../../appointments/appointments.service';
import { PatientsService } from '../../patients/patients.service';
import { RoomsService } from '../../rooms/rooms.service';
import { GqlJwtAuthGuard } from '../gql-jwt-auth.guard';
import { DashboardStatsModel } from './dashboard-stats.model';

@Resolver()
@UseGuards(GqlJwtAuthGuard)
export class DashboardResolver {
  constructor(
    private readonly appts: AppointmentsService,
    private readonly rooms: RoomsService,
    private readonly patients: PatientsService,
  ) {}

  @Query(() => DashboardStatsModel)
  async dashboardStats(): Promise<DashboardStatsModel> {
    const [todayRows, scheduledCount, patientCount, roomStats] =
      await Promise.all([
        this.appts.findToday(null),
        this.appts.countScheduled(),
        this.patients.count(),
        this.rooms.stats(),
      ]);
    return {
      todayCount: todayRows.length,
      scheduledCount,
      patientCount,
      roomStats,
    };
  }
}
