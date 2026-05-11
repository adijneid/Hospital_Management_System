import api from './api.js';

export const roomService = {
    getAll: () =>
        api.get('/rooms').then(r => r.data),

    getStats: () =>
        api.get('/rooms/stats').then(r => r.data),

    getById: (id) =>
        api.get(`/rooms/${id}`).then(r => r.data),

    getAvailable: () =>
        api.get('/rooms/available').then(r => r.data),

    create: (data) =>
        api.post('/rooms', data).then(r => r.data),

    update: (id, data) =>
        api.put(`/rooms/${id}`, data).then(r => r.data),

    updateStatus: (id, status) =>
        api.put(`/rooms/${id}/status`, { status }).then(r => r.data),

    delete: (id) =>
        api.delete(`/rooms/${id}`),

    getAppointments: (id) =>
        api.get(`/appointments/room/${id}`).then(r => r.data),

    getSchedule: (id) =>
        api.get(`/appointments/room/${id}/schedule`).then(r => r.data),
};
