import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth.js';
import { authService } from '../../services/authService.js';
import {
    fetchDoctorById,
    selectDoctorById,
    updateDoctor,
} from '../../store/slices/doctorsSlice.js';
import { FormField, Input } from './FormField.jsx';
import Button from './Button.jsx';
import toast from 'react-hot-toast';

const SPECIALTIES = ['General Medicine', 'Cardiology', 'Surgery', 'Pediatrics', 'Orthopedics', 'Neurology', 'Dermatology', 'Radiology', 'Oncology', 'Other'];

export default function ProfileEditor({ onClose }) {
    const dispatch = useDispatch();
    const { user } = useAuth();
    const isDoctor = user?.role === 'doctor';
    const doctorId = user?.doctorId;

    const doctor = useSelector((s) =>
        isDoctor && doctorId ? selectDoctorById(s, doctorId) : null,
    );

    useEffect(() => {
        if (isDoctor && doctorId && !doctor) {
            dispatch(fetchDoctorById(doctorId));
        }
    }, [dispatch, isDoctor, doctorId, doctor]);

    if (isDoctor && doctorId && !doctor) {
        return <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>;
    }

    return isDoctor && doctor
        ? <DoctorProfileForm doctor={doctor} doctorId={doctorId} onClose={onClose} />
        : <StaffProfileForm user={user} onClose={onClose} />;
}

function DoctorProfileForm({ doctor, doctorId, onClose }) {
    const dispatch = useDispatch();
    const { user, updateUser } = useAuth();
    const [form, setForm] = useState({
        first_name: doctor.first_name || '',
        last_name:  doctor.last_name  || '',
        specialty:  doctor.specialty  || '',
        phone:      doctor.phone      || '',
    });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    function set(field, value) {
        setForm(f => ({ ...f, [field]: value }));
        if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = {};
        if (!form.first_name.trim()) errs.first_name = 'Required';
        if (!form.last_name.trim())  errs.last_name  = 'Required';
        if (!form.specialty.trim())  errs.specialty  = 'Required';
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setSaving(true);
        try {
            await dispatch(updateDoctor({ id: doctorId, dto: form })).unwrap();
            updateUser({ fullName: `Dr. ${form.first_name} ${form.last_name}` });
            toast.success('Profile updated');
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Failed to update');
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="text-gray-500">Email: <span className="text-gray-900 font-medium">{user?.email}</span></p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField label="First Name" required error={errors.first_name}>
                    <Input value={form.first_name} onChange={e => set('first_name', e.target.value)} />
                </FormField>
                <FormField label="Last Name" required error={errors.last_name}>
                    <Input value={form.last_name} onChange={e => set('last_name', e.target.value)} />
                </FormField>
            </div>

            <FormField label="Specialty" required error={errors.specialty}>
                <Input
                    list="profile-specialty-list"
                    value={form.specialty}
                    onChange={e => set('specialty', e.target.value)}
                />
                <datalist id="profile-specialty-list">
                    {SPECIALTIES.map(s => <option key={s} value={s} />)}
                </datalist>
            </FormField>

            <FormField label="Phone">
                <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+961-70-000000" />
            </FormField>

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit" loading={saving}>Save Changes</Button>
            </div>
        </form>
    );
}

function StaffProfileForm({ user, onClose }) {
    const { updateUser } = useAuth();
    const [form, setForm] = useState({
        full_name: user?.fullName || '',
        email:     user?.email    || '',
    });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    function set(field, value) {
        setForm(f => ({ ...f, [field]: value }));
        if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = {};
        if (!form.full_name.trim()) errs.full_name = 'Required';
        if (!form.email.trim())     errs.email     = 'Required';
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setSaving(true);
        try {
            await authService.updateProfile(user.userId, {
                full_name: form.full_name,
                email: form.email,
                role: user.role,
            });
            updateUser({ fullName: form.full_name, email: form.email });
            toast.success('Profile updated');
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update');
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="text-gray-500">Role: <span className="text-gray-900 font-medium capitalize">{user?.role}</span></p>
            </div>

            <FormField label="Full Name" required error={errors.full_name}>
                <Input value={form.full_name} onChange={e => set('full_name', e.target.value)} />
            </FormField>

            <FormField label="Email" required error={errors.email}>
                <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </FormField>

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit" loading={saving}>Save Changes</Button>
            </div>
        </form>
    );
}
