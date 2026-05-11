import { gql } from '@apollo/client';

// ── Dashboard ─────────────────────────────────────────────────
export const DASHBOARD_STATS = gql`
    query DashboardStats {
        dashboardStats {
            todayCount
            scheduledCount
            patientCount
            roomStats {
                total
                available
                occupied
                maintenance
            }
        }
    }
`;

// ── Appointments ──────────────────────────────────────────────
export const TODAYS_APPOINTMENTS = gql`
    query TodaysAppointments($doctorId: ID) {
        todaysAppointments(doctorId: $doctorId) {
            appointment_id
            scheduled_start
            scheduled_end
            status
            reason
            patient {
                patient_id
                first_name
                last_name
                phone
            }
            doctor {
                doctor_id
                first_name
                last_name
                specialty
            }
            room {
                room_id
                room_number
            }
        }
    }
`;

// ── Patients ──────────────────────────────────────────────────
export const PATIENT_FIELDS = gql`
    fragment PatientFields on Patient {
        patient_id
        first_name
        last_name
        date_of_birth
        gender
        phone
        email
        blood_type
        medical_notes
        address
    }
`;

export const PATIENTS_QUERY = gql`
    ${PATIENT_FIELDS}
    query Patients($limit: Int, $offset: Int) {
        patients(limit: $limit, offset: $offset) {
            ...PatientFields
        }
    }
`;

export const PATIENT_QUERY = gql`
    ${PATIENT_FIELDS}
    query Patient($id: ID!) {
        patient(id: $id) {
            ...PatientFields
        }
    }
`;

export const SEARCH_PATIENTS_QUERY = gql`
    ${PATIENT_FIELDS}
    query SearchPatients($name: String!) {
        searchPatients(name: $name) {
            ...PatientFields
        }
    }
`;

export const CREATE_PATIENT_MUTATION = gql`
    ${PATIENT_FIELDS}
    mutation CreatePatient($input: CreatePatientInput!) {
        createPatient(input: $input) {
            ...PatientFields
        }
    }
`;

export const UPDATE_PATIENT_MUTATION = gql`
    ${PATIENT_FIELDS}
    mutation UpdatePatient($id: ID!, $input: UpdatePatientInput!) {
        updatePatient(id: $id, input: $input) {
            ...PatientFields
        }
    }
`;

export const DELETE_PATIENT_MUTATION = gql`
    mutation DeletePatient($id: ID!) {
        deletePatient(id: $id)
    }
`;

// ── Doctors ───────────────────────────────────────────────────
export const DOCTOR_FIELDS = gql`
    fragment DoctorFields on Doctor {
        doctor_id
        first_name
        last_name
        specialty
        phone
        user_id
    }
`;

export const DOCTORS_QUERY = gql`
    ${DOCTOR_FIELDS}
    query Doctors {
        doctors {
            ...DoctorFields
        }
    }
`;

export const DOCTOR_QUERY = gql`
    ${DOCTOR_FIELDS}
    query Doctor($id: ID!) {
        doctor(id: $id) {
            ...DoctorFields
        }
    }
`;

export const DOCTORS_BY_SPECIALTY_QUERY = gql`
    ${DOCTOR_FIELDS}
    query DoctorsBySpecialty($specialty: String!) {
        doctorsBySpecialty(specialty: $specialty) {
            ...DoctorFields
        }
    }
`;

export const CREATE_DOCTOR_MUTATION = gql`
    ${DOCTOR_FIELDS}
    mutation CreateDoctor($input: CreateDoctorInput!) {
        createDoctor(input: $input) {
            ...DoctorFields
        }
    }
`;

export const UPDATE_DOCTOR_MUTATION = gql`
    ${DOCTOR_FIELDS}
    mutation UpdateDoctor($id: ID!, $input: UpdateDoctorInput!) {
        updateDoctor(id: $id, input: $input) {
            ...DoctorFields
        }
    }
`;

export const DELETE_DOCTOR_MUTATION = gql`
    mutation DeleteDoctor($id: ID!) {
        deleteDoctor(id: $id)
    }
`;

// ── Rooms ─────────────────────────────────────────────────────
export const ROOM_FIELDS = gql`
    fragment RoomFields on Room {
        room_id
        room_number
        room_type
        floor
        capacity
        status
    }
`;

export const ROOMS_QUERY = gql`
    ${ROOM_FIELDS}
    query Rooms {
        rooms {
            ...RoomFields
        }
    }
`;

export const ROOM_QUERY = gql`
    ${ROOM_FIELDS}
    query Room($id: ID!) {
        room(id: $id) {
            ...RoomFields
        }
    }
`;

export const AVAILABLE_ROOMS_QUERY = gql`
    ${ROOM_FIELDS}
    query AvailableRooms($roomType: String) {
        availableRooms(roomType: $roomType) {
            ...RoomFields
        }
    }
`;

export const CREATE_ROOM_MUTATION = gql`
    ${ROOM_FIELDS}
    mutation CreateRoom($input: CreateRoomInput!) {
        createRoom(input: $input) {
            ...RoomFields
        }
    }
`;

export const UPDATE_ROOM_MUTATION = gql`
    ${ROOM_FIELDS}
    mutation UpdateRoom($id: ID!, $input: UpdateRoomInput!) {
        updateRoom(id: $id, input: $input) {
            ...RoomFields
        }
    }
`;

export const UPDATE_ROOM_STATUS_MUTATION = gql`
    ${ROOM_FIELDS}
    mutation UpdateRoomStatus($id: ID!, $status: String!) {
        updateRoomStatus(id: $id, status: $status) {
            ...RoomFields
        }
    }
`;

export const DELETE_ROOM_MUTATION = gql`
    mutation DeleteRoom($id: ID!) {
        deleteRoom(id: $id)
    }
`;
