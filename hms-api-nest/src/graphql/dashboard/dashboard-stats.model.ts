import { Field, Int, ObjectType } from '@nestjs/graphql';
import { RoomStatsModel } from './room-stats.model';

@ObjectType('DashboardStats')
export class DashboardStatsModel {
  @Field(() => Int) todayCount: number;
  @Field(() => Int) scheduledCount: number;
  @Field(() => Int) patientCount: number;
  @Field(() => RoomStatsModel) roomStats: RoomStatsModel;
}
