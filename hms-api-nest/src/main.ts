import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(
    helmet({
      // Swagger UI loads inline scripts/styles; relax CSP for the docs route only.
      contentSecurityPolicy: false,
    }),
  );

  app.setGlobalPrefix('api', { exclude: ['/graphql', '/docs', '/docs-json'] });

  app.enableCors({
    origin: config.get<string>('CLIENT_ORIGIN') ?? 'http://localhost:5173',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Hospital Management System API')
    .setDescription(
      'REST API for the HMS — University of Balamand, CSIS 279.\n\n' +
        'Authenticate via `POST /api/auth/login`, then click **Authorize** ' +
        'and paste the returned `access_token` to call protected endpoints.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .addTag('auth', 'Login and current-user endpoints')
    .addTag('users', 'User management (staff-only)')
    .addTag('patients', 'Patient records')
    .addTag('doctors', 'Doctor profiles')
    .addTag('doctor-availability', 'Weekly working-hours per doctor')
    .addTag('rooms', 'Hospital rooms (consultation / treatment / surgery)')
    .addTag('appointments', 'Appointment scheduling and status transitions')
    .addTag('prescriptions', 'Medications attached to a completed visit')
    .addTag('reminders', 'Email reminder dispatch')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = parseInt(config.get<string>('PORT') ?? '4000', 10);
  await app.listen(port);
}
bootstrap();
