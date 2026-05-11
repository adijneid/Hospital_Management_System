import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../auth/jwt.strategy';

export type EntityEventType = 'created' | 'updated' | 'status_changed' | 'deleted';

export interface AppointmentEvent {
  type: EntityEventType;
  appointment_id: string;
  doctor_id?: string;
  patient_id?: string;
  status?: string;
  changed_by?: string | null;
}

export interface DoctorEvent {
  type: Extract<EntityEventType, 'created' | 'updated' | 'deleted'>;
  doctor_id: string;
}

export interface RoomEvent {
  type: Extract<EntityEventType, 'created' | 'updated' | 'status_changed' | 'deleted'>;
  room_id: string;
  status?: string;
}

/**
 * Single real-time gateway for the whole app. Clients connect with a JWT in
 * the handshake's `auth.token`; bad/missing tokens are disconnected. After
 * connection, clients are joined to a `role:<role>` room and (for doctors) a
 * `doctor:<doctor_id>` room so we can broadcast narrowly when needed.
 *
 * Channels currently emitted:
 *   - `appointment.event`  fired from AppointmentsService on every mutation
 *   - `doctor.event`       fired from DoctorsService on create/update/delete
 *   - `room.event`         fired from RoomsService on create/update/status/delete
 *
 * Mounted at the same HTTP server as REST/GraphQL (port 4000). Frontend
 * connects via socket.io-client; Vite proxies `/socket.io/*` to the backend.
 */
@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(@ConnectedSocket() client: Socket) {
    const token =
      client.handshake.auth?.token ??
      client.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      this.logger.warn(`ws connect rejected (no token) sid=${client.id}`);
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      client.data.user = payload;
      client.join(`role:${payload.role}`);
      if (payload.doctorId) client.join(`doctor:${payload.doctorId}`);
      this.logger.log(
        `ws connect ${payload.email} (${payload.role}) sid=${client.id}`,
      );
    } catch {
      this.logger.warn(`ws connect rejected (bad token) sid=${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const user = client.data.user as JwtPayload | undefined;
    this.logger.log(
      `ws disconnect ${user?.email ?? '<anon>'} sid=${client.id}`,
    );
  }

  emitAppointmentEvent(event: AppointmentEvent) {
    this.server.emit('appointment.event', event);
  }

  emitDoctorEvent(event: DoctorEvent) {
    this.server.emit('doctor.event', event);
  }

  emitRoomEvent(event: RoomEvent) {
    this.server.emit('room.event', event);
  }
}
