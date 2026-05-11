import api from './api.js';

export const appointmentService = {
    getAll: () =>
        api.get('/appointments').then(r => r.data),

    getToday: (doctor_id = null) =>
        api.get('/appointments/today', { params: doctor_id ? { doctor_id } : {} }).then(r => r.data),

    getById: (id) =>
        api.get(`/appointments/${id}`).then(r => r.data),

    getByStatus: (status) =>
        api.get('/appointments/status', { params: { status } }).then(r => r.data),

    create: (data) =>
        api.post('/appointments', data).then(r => r.data),

    update: (id, data) =>
        api.put(`/appointments/${id}`, data).then(r => r.data),

    updateStatus: (id, status) =>
        api.put(`/appointments/${id}/status`, { status }).then(r => r.data),

    delete: (id) =>
        api.delete(`/appointments/${id}`),

    sendReminder: (id, force = false) =>
        api.post(`/appointments/${id}/send-reminder${force ? '?force=true' : ''}`).then(r => r.data),

    getCount: () =>
        api.get('/appointments/count').then(r => r.data),

    getScheduledCount: () =>
        api.get('/appointments/scheduled/count').then(r => r.data),
};
