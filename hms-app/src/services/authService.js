import api from './api.js';

export const authService = {
    login: (identifier, password) =>
        api.post('/auth/login', { email: identifier, password }).then(r => r.data.data),

    getMe: () =>
        api.get('/auth/me').then(r => r.data),

    updateProfile: (userId, data) =>
        api.put(`/users/${userId}`, data).then(r => r.data),
};
