import { useState } from 'react';
import { FormField, Input } from '../common/FormField.jsx';
import Button from '../common/Button.jsx';

const SPECIALTIES = ['General Medicine', 'Cardiology', 'Surgery', 'Pediatrics', 'Orthopedics', 'Neurology', 'Dermatology', 'Radiology', 'Oncology', 'Other'];

export default function DoctorForm({ initial = {}, onSubmit, onCancel, loading = false }) {
    const isNew = !initial.doctor_id;

    const [form, setForm] = useState({
        first_name: initial.first_name || '',
        last_name:  initial.last_name  || '',
        specialty:  initial.specialty  || '',
        phone:      initial.phone      || '',
        email:      '',
        password:   '',
    });
    const [errors, setErrors] = useState({});

    function set(field, value) {
        setForm(f => ({ ...f, [field]: value }));
        if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
    }

    function validate() {
        const errs = {};
        if (!form.first_name.trim()) errs.first_name = 'Required';
        if (!form.last_name.trim())  errs.last_name  = 'Required';
        if (!form.specialty.trim())  errs.specialty  = 'Required';
        if (isNew) {
            if (!form.email.trim())    errs.email    = 'Required';
            if (!form.password.trim()) errs.password = 'Required';
            if (form.password && form.password.length < 6) errs.password = 'Min 6 characters';
        }
        return errs;
    }

    function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        const data = {
            first_name: form.first_name,
            last_name:  form.last_name,
            specialty:  form.specialty,
            phone:      form.phone,
        };
        if (isNew) {
            data.email    = form.email;
            data.password = form.password;
        }
        onSubmit(data);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
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
                    list="specialty-list"
                    value={form.specialty}
                    onChange={e => set('specialty', e.target.value)}
                    placeholder="e.g. Cardiology"
                />
                <datalist id="specialty-list">
                    {SPECIALTIES.map(s => <option key={s} value={s} />)}
                </datalist>
            </FormField>

            <FormField label="Phone">
                <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+961-70-000000" />
            </FormField>

            {isNew && (
                <>
                    <FormField label="Email" required error={errors.email}>
                        <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="doctor@hms.lb" />
                    </FormField>
                    <FormField label="Password" required error={errors.password}>
                        <Input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 characters" />
                    </FormField>
                </>
            )}

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit" loading={loading}>
                    {isNew ? 'Register Doctor' : 'Save Changes'}
                </Button>
            </div>
        </form>
    );
}
