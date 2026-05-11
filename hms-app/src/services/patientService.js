import api from './api.js';

export const patientService = {
    getAll: () =>
        api.get('/patients').then(r => r.data),

    search: (name) =>
        api.get('/patients/search', { params: { name } }).then(r => r.data),

    getById: (id) =>
        api.get(`/patients/${id}`).then(r => r.data),

    create: (data) =>
        api.post('/patients', data).then(r => r.data),

    update: (id, data) =>
        api.put(`/patients/${id}`, data).then(r => r.data),

    delete: (id) =>
        api.delete(`/patients/${id}`),

    getCount: () =>
        api.get('/patients/count').then(r => r.data),

    getAppointments: (id) =>
        api.get(`/appointments/patient/${id}`).then(r => r.data),
};
