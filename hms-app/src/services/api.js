import axios from 'axios';
import { store } from '../store/index.js';
import { logout } from '../store/slices/authSlice.js';

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('hms_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// On 401, clear session via Redux and redirect to login
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            store.dispatch(logout());
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default api;
