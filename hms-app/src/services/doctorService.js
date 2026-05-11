import api from './api.js';

export const doctorService = {
    getAll: () =>
        api.get('/doctors').then(r => r.data),

    getById: (id) =>
        api.get(`/doctors/${id}`).then(r => r.data),

    update: (id, data) =>
        api.put(`/doctors/${id}`, data).then(r => r.data),

    getAppointments: (id) =>
        api.get(`/appointments/doctor/${id}`).then(r => r.data),

    getSchedule: (id, start_date, end_date) =>
        api.get(`/appointments/doctor/${id}/schedule`, { params: { start_date, end_date } }).then(r => r.data),

    getAvailability: (id) =>
        api.get(`/doctor-availability/doctor/${id}`).then(r => r.data),

    getPatients: (id) =>
        api.get(`/appointments/doctor/${id}/patients`).then(r => r.data),

    getPatientHistory: (doctorId, patientId) =>
        api.get(`/appointments/doctor/${doctorId}/patient/${patientId}/history`).then(r => r.data),

    createAvailability: (data) =>
        api.post('/doctor-availability', data).then(r => r.data),

    deleteAvailability: (id) =>
        api.delete(`/doctor-availability/${id}`),

    create: (data) =>
        api.post('/doctors', data).then(r => r.data),

    delete: (id) =>
        api.delete(`/doctors/${id}`),
};
