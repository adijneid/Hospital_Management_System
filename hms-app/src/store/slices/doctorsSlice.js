import { createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { doctorService } from '../../services/doctorService.js';

const adapter = createEntityAdapter({ selectId: (d) => d.doctor_id });

export const fetchDoctors = createAsyncThunk(
    'doctors/fetchAll',
    () => doctorService.getAll(),
);

export const fetchDoctorById = createAsyncThunk(
    'doctors/fetchById',
    (id) => doctorService.getById(id),
);

export const createDoctor = createAsyncThunk(
    'doctors/create',
    (dto) => doctorService.create(dto),
);

export const updateDoctor = createAsyncThunk(
    'doctors/update',
    ({ id, dto }) => doctorService.update(id, dto),
);

export const deleteDoctor = createAsyncThunk(
    'doctors/delete',
    async (id) => {
        await doctorService.delete(id);
        return id;
    },
);

const doctorsSlice = createSlice({
    name: 'doctors',
    initialState: adapter.getInitialState({ status: 'idle', error: null }),
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchDoctors.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchDoctors.fulfilled, (state, action) => {
                state.status = 'succeeded';
                adapter.setAll(state, action.payload);
            })
            .addCase(fetchDoctors.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message ?? 'Failed to load doctors';
            })
            .addCase(fetchDoctorById.fulfilled, (state, action) => {
                if (action.payload) adapter.upsertOne(state, action.payload);
            })
            .addCase(createDoctor.fulfilled, (state, action) => {
                adapter.addOne(state, action.payload);
            })
            .addCase(updateDoctor.fulfilled, (state, action) => {
                adapter.upsertOne(state, action.payload);
            })
            .addCase(deleteDoctor.fulfilled, (state, action) => {
                adapter.removeOne(state, action.payload);
            });
    },
});

export default doctorsSlice.reducer;

const selectors = adapter.getSelectors((state) => state.doctors);
export const selectAllDoctors = selectors.selectAll;
export const selectDoctorById = selectors.selectById;
export const selectDoctorsStatus = (state) => state.doctors.status;
export const selectDoctorsError = (state) => state.doctors.error;
