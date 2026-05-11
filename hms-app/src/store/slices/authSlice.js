import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api.js';
import { disconnectSocket, getSocket } from '../../realtime/socket.js';

const TOKEN_KEY = 'hms_token';
const USER_KEY = 'hms_user';

export const bootstrap = createAsyncThunk('auth/bootstrap', async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const stored = localStorage.getItem(USER_KEY);
    if (!token || !stored) return { token: null, user: null };

    // Validate the stored token against the server. A stale/tampered/expired
    // token would otherwise paint the dashboard for a moment before the first
    // protected request 401s. Using bare fetch avoids the api.js interceptor
    // (which would force a /login redirect on 401 — we want bootstrap to
    // resolve normally and let the route guard navigate).
    try {
        const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('invalid');
        const user = JSON.parse(stored);
        getSocket();
        return { token, user };
    } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        return { token: null, user: null };
    }
});

export const login = createAsyncThunk('auth/login', async ({ identifier, password }) => {
    const res = await api.post('/auth/login', { email: identifier, password });
    const { token, user } = res.data.data;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    getSocket(); // connect now that we have a fresh token
    return { token, user };
});

export const logout = createAsyncThunk('auth/logout', () => {
    disconnectSocket();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
});

const authSlice = createSlice({
    name: 'auth',
    initialState: { user: null, token: null, loading: true },
    reducers: {
        updateUser(state, action) {
            state.user = { ...state.user, ...action.payload };
            localStorage.setItem(USER_KEY, JSON.stringify(state.user));
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(bootstrap.fulfilled, (state, action) => {
                state.token = action.payload.token;
                state.user = action.payload.user;
                state.loading = false;
            })
            .addCase(bootstrap.rejected, (state) => {
                state.loading = false;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.token = action.payload.token;
                state.user = action.payload.user;
            })
            .addCase(logout.fulfilled, (state) => {
                state.token = null;
                state.user = null;
            });
    },
});

export const { updateUser } = authSlice.actions;
export default authSlice.reducer;

export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectIsAuthenticated = (state) => Boolean(state.auth.user);
