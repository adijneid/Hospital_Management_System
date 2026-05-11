import { useState } from 'react';
import { FormField, Input, Select } from '../common/FormField.jsx';
import Button from '../common/Button.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { patientService } from '../../services/patientService.js';
import { doctorService } from '../../services/doctorService.js';
import { roomService } from '../../services/roomService.js';

function toLocalDateTimeInput(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toISOString().slice(0, 16);
}

export default function AppointmentForm({ initial = {}, onSubmit, onCancel, loading = false }) {
    const { data: patients } = useFetch(() => patientService.getAll());
    const { data: doctors }  = useFetch(() => doctorService.getAll());
    const { data: rooms }    = useFetch(() => roomService.getAvailable());

    const [form, setForm] = useState({
        patient_id:      initial.patient_id      || '',
        doctor_id:       initial.doctor_id        || '',
        room_id:         initial.room_id          || '',
        scheduled_start: toLocalDateTimeInput(initial.scheduled_start) || '',
        scheduled_end:   toLocalDateTimeInput(initial.scheduled_end)   || '',
        reason:          initial.reason           || '',
    });
    const [errors, setErrors] = useState({});
    const [conflictError, setConflictError] = useState(null);

    function set(field, value) {
        setForm(f => ({ ...f, [field]: value }));
        if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
        setConflictError(null);
    }

    function validate() {
        const errs = {};
        if (!form.patient_id)      errs.patient_id      = 'Patient is required';
        if (!form.doctor_id)       errs.doctor_id        = 'Doctor is required';
        if (!form.scheduled_start) errs.scheduled_start  = 'Start time is required';
        if (!form.scheduled_end)   errs.scheduled_end    = 'End time is required';
        if (form.scheduled_start && form.scheduled_end && form.scheduled_end <= form.scheduled_start)
            errs.scheduled_end = 'End must be after start';
        return errs;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setConflictError(null);
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        try {
            await onSubmit({
                ...form,
                room_id: form.room_id || null,
            });
        } catch (err) {
            if (err.response?.status === 409) {
                setConflictError(err.response.data?.message || 'Scheduling conflict detected.');
            } else {
                throw err;
            }
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {conflictError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    ⚠ {conflictError}
                </div>
            )}

            <FormField label="Patient" required error={errors.patient_id}>
                <Select value={form.patient_id} onChange={e => set('patient_id', e.target.value)}>
                    <option value="">Select patient…</option>
                    {patients?.map(p => (
                        <option key={p.patient_id} value={p.patient_id}>
                            {p.first_name} {p.last_name}
                        </option>
                    ))}
                </Select>
            </FormField>

            <FormField label="Doctor" required error={errors.doctor_id}>
                <Select value={form.doctor_id} onChange={e => set('doctor_id', e.target.value)}>
                    <option value="">Select doctor…</option>
                    {doctors?.map(d => (
                        <option key={d.doctor_id} value={d.doctor_id}>
                            Dr. {d.first_name} {d.last_name} — {d.specialty}
                        </option>
                    ))}
                </Select>
            </FormField>

            <FormField label="Room">
                <Select value={form.room_id} onChange={e => set('room_id', e.target.value)}>
                    <option value="">No room assigned</option>
                    {rooms?.map(r => (
                        <option key={r.room_id} value={r.room_id}>
                            Room {r.room_number} — {r.room_type} (Floor {r.floor})
                        </option>
                    ))}
                </Select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
                <FormField label="Start" required error={errors.scheduled_start}>
                    <Input type="datetime-local" value={form.scheduled_start} onChange={e => set('scheduled_start', e.target.value)} />
                </FormField>
                <FormField label="End" required error={errors.scheduled_end}>
                    <Input type="datetime-local" value={form.scheduled_end} onChange={e => set('scheduled_end', e.target.value)} />
                </FormField>
            </div>

            <FormField label="Reason">
                <Input value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="Chief complaint or visit purpose" />
            </FormField>

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit" loading={loading}>
                    {initial.appointment_id ? 'Save Changes' : 'Book Appointment'}
                </Button>
            </div>
        </form>
    );
}
