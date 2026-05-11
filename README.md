# Hospital Management System (HMS)

CSIS279 semester project — University of Balamand, Spring 2026.

A full-stack HMS for scheduling and room allocation, with role-based access (staff vs doctor),
real-time appointment updates, and a mix of REST and GraphQL APIs.

## Project Structure

```
.
├── hms-api-nest/   NestJS + TypeScript backend (PostgreSQL + TypeORM)
│   ├── src/        modules: auth, users, patients, doctors, doctor-availability,
│   │               rooms, appointments, graphql, realtime, common
│   └── database/   schema (hms.sql) + migrations
└── hms-app/        React 19 + Vite + Tailwind + Redux Toolkit + Apollo Client
```

## Stack

**Backend (`hms-api-nest`)** — Nest 11, TypeORM, JWT (`@nestjs/jwt` + `passport-jwt`),
bcrypt, `class-validator`, `@nestjs/graphql` + `@apollo/server` v4 (code-first),
`@nestjs/websockets` + `socket.io`, `helmet`, `@nestjs/throttler`.

**Frontend (`hms-app`)** — React 19, Vite, Tailwind, React Router, Redux Toolkit
(`@reduxjs/toolkit` + `react-redux`) for auth + doctors slices, Apollo Client for
the dashboard GraphQL queries, axios for the rest, `socket.io-client` for live updates,
`react-hot-toast` for notifications.

## Prerequisites

- Node.js v18+
- PostgreSQL 14+

## Setup

### 1. Database

```bash
createdb hms_db
psql -U postgres -d hms_db -f hms-api-nest/database/hms.sql
psql -U postgres -d hms_db -f hms-api-nest/database/migrations/001_add_patient_address.sql
psql -U postgres -d hms_db -f hms-api-nest/database/migrations/002_appointment_status_history.sql
```

### 2. Backend

```bash
cd hms-api-nest
cp .env.example .env       # then edit PG* and JWT_SECRET as needed
npm install
npm run start:dev          # http://localhost:4000  (REST: /api/*, GraphQL: /graphql, WS: /socket.io)
```

### 3. Frontend

```bash
cd hms-app
npm install
npm run dev                # http://localhost:5173  (Vite proxies /api, /graphql, /socket.io)
```

## Demo credentials

| Role   | Email                  | Password    |
|--------|------------------------|-------------|
| Staff  | `sarah.jenkins@hms.lb` | `password123` |
| Doctor | `dr.hassan@hms.lb`     | `password123` |

(Both users can also log in with their `username` instead of email.)

## API Surface

### REST — `/api/*` (JWT-guarded except for login/register)

| Module               | Endpoints |
|----------------------|-----------|
| `auth`               | `POST /login`, `POST /register`, `GET /me` (login + register rate-limited 5/min/IP) |
| `users`              | `GET, GET/:id, POST, PUT/:id, DELETE/:id` *(staff only)* |
| `patients`           | `GET, GET/count, GET/email, GET/search, GET/:id, POST, PUT/:id, DELETE/:id` *(writes: staff only)* |
| `doctors`            | `GET, GET/count, GET/specialty, GET/user/:userId, GET/:id, POST, PUT/:id, DELETE/:id` *(POST + DELETE: staff only; PUT: staff or the doctor themselves)* |
| `doctor-availability`| `GET, GET/:id, GET/doctor/:id, GET/doctor/:id/day, POST, PUT/:id, DELETE/:id, DELETE/doctor/:id` *(writes: staff only)* |
| `rooms`              | `GET, GET/count, GET/stats, GET/available, GET/available/count, GET/available/type, GET/number, GET/type, GET/floor, GET/:id, POST, PUT/:id, PUT/:id/status, DELETE/:id` *(writes: staff only)* |
| `appointments`       | `GET, GET/raw, GET/count, GET/scheduled/count, GET/today, GET/status, GET/patient/:id, GET/doctor/:id, GET/doctor/:id/schedule, GET/doctor/:id/patients, GET/doctor/:d/patient/:p/history, GET/room/:id, GET/room/:id/schedule, GET/:id, GET/:id/history, POST, PUT/:id, PUT/:id/status, DELETE/:id` *(DELETE: staff only)* |

### GraphQL — `/graphql`

Code-first schema, JWT in `Authorization` header, two queries:

```graphql
query {
  dashboardStats { todayCount scheduledCount patientCount roomStats { total available occupied maintenance } }
  todaysAppointments(doctorId: ID) {
    appointment_id scheduled_start scheduled_end status reason
    patient { patient_id first_name last_name phone }
    doctor  { doctor_id first_name last_name specialty }
    room    { room_id room_number }
  }
}
```

### WebSocket — `/socket.io` (JWT in handshake `auth.token`)

Single broadcast channel `appointment.event` with payload
`{ type: 'created' | 'updated' | 'status_changed' | 'deleted', appointment_id, doctor_id?, patient_id?, status?, changed_by? }`.
Triggered on every appointments mutation.

## Database

Tables: `users`, `doctors`, `doctor_availability`, `rooms`, `patients`, `appointments`,
`appointment_status_history`. View: `vw_todays_appointments`.

Migrations under `hms-api-nest/database/migrations/` are idempotent (`IF NOT EXISTS`).
TypeORM runs with `synchronize: false` — schema is owned by SQL files, not by entity decorators.

## Architecture highlights

- **Modular Nest backend** — one feature module per domain, plus `common/` (filters, middleware,
  guards), `realtime/`, `graphql/`.
- **Global validation** via `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })`.
- **Global serialization** via `ClassSerializerInterceptor` — `password_hash` is `@Exclude()`d.
- **Global exception filter** wraps unknown errors into `{ success:false, message }`.
- **Logger middleware** prints `METHOD URL STATUS Xms` per request.
- **Helmet** for HTTP security headers; **`@nestjs/throttler`** for rate limiting (5/min on auth).
- **Redux Toolkit** for `auth` (replaces an old Context) and `doctors` (entity adapter).
  All other state is page-local via `useFetch`.
- **Apollo Client** for the `dashboardStats` and `todaysAppointments` queries — replaces 4+
  REST calls per dashboard.
- **WebSocket-driven refetches** in `StaffDashboard`, `DoctorDashboard`, `AppointmentsPage`.

## Testing

End-to-end manual flow: open two browser windows side by side, log in as staff in one and
as doctor in the other, change an appointment in either — the other window updates without
a refresh (WebSocket broadcast → page refetch).
