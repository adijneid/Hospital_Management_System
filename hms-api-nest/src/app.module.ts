import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsModule } from './appointments/appointments.module';
import { AuthModule } from './auth/auth.module';
import { AppThrottlerGuard } from './common/app-throttler.guard';
import { LoggerMiddleware } from './common/logger.middleware';
import { DoctorAvailabilityModule } from './doctor-availability/doctor-availability.module';
import { DoctorsModule } from './doctors/doctors.module';
import { GraphqlFeatureModule } from './graphql/graphql-feature.module';
import { PatientsModule } from './patients/patients.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { RemindersModule } from './reminders/reminders.module';
import { RoomsModule } from './rooms/rooms.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('PGHOST'),
        port: parseInt(config.get<string>('PGPORT') ?? '5432', 10),
        database: config.get<string>('PGDATABASE'),
        username: config.get<string>('PGUSER'),
        password: config.get<string>('PGPASSWORD'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: false,
      introspection: true,
      context: ({ req }) => ({ req }),
      formatError: (err) => {
        const status = (err.extensions?.originalError as any)?.statusCode;
        if (status === 401) {
          return {
            ...err,
            extensions: { ...err.extensions, code: 'UNAUTHENTICATED' },
          };
        }
        return err;
      },
    }),
    // Single global throttler: 200 req/min per IP. Plenty of headroom for
    // React StrictMode double-fires + dashboards issuing parallel reads.
    // The auth controller overrides this on a per-route basis with a
    // tighter `@Throttle({ default: { limit: 5, ttl: 60_000 } })`.
    //
    // (Do NOT add a second named bucket here — multiple buckets stack and
    // the strictest one wins for every request. That made /api/rooms hit
    // the 5/min auth limit on normal page loads.)
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 200 }]),
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    PatientsModule,
    DoctorsModule,
    DoctorAvailabilityModule,
    RoomsModule,
    AppointmentsModule,
    PrescriptionsModule,
    RemindersModule,
    GraphqlFeatureModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AppThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('{*splat}');
  }
}
