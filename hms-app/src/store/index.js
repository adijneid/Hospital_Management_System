import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import doctorsReducer from './slices/doctorsSlice.js';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        doctors: doctorsReducer,
    },
});
