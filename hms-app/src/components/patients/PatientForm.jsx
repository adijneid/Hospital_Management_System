import { useState } from 'react';
import { FormField, Input, Select, Textarea } from '../common/FormField.jsx';
import Button from '../common/Button.jsx';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PatientForm({ initial = {}, onSubmit, onCancel, loading = false }) {
    const [form, setForm] = useState({
        first_name:    initial.first_name    || '',
        last_name:     initial.last_name     || '',
        date_of_birth: initial.date_of_birth ? initial.date_of_birth.split('T')[0] : '',
        gender:        initial.gender        || '',
        phone:         initial.phone         || '',
        email:         initial.email         || '',
        address:       initial.address       || '',
        blood_type:    initial.blood_type    || '',
        medical_notes: initial.medical_notes || '',
    });
    const [errors, setErrors] = useState({});

    function set(field, value) {
        setForm(f => ({ ...f, [field]: value }));
        if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
    }

    function validate() {
        const errs = {};
        if (!form.first_name.trim()) errs.first_name = 'First name is required';
        if (!form.last_name.trim())  errs.last_name  = 'Last name is required';
        if (!form.date_of_birth)     errs.date_of_birth = 'Date of birth is required';
        if (!form.gender.trim())     errs.gender     = 'Gender is required';
        if (!form.phone.trim())      errs.phone      = 'Phone number is required';
        return errs;
    }

    function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        onSubmit({
            ...form,
            email:         form.email         || null,
            address:       form.address       || null,
            blood_type:    form.blood_type    || null,
            medical_notes: form.medical_notes || null,
        });
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

            <div className="grid grid-cols-2 gap-4">
                <FormField label="Date of Birth" required error={errors.date_of_birth}>
                    <Input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
                </FormField>
                <FormField label="Gender" required error={errors.gender}>
                    <Select value={form.gender} onChange={e => set('gender', e.target.value)}>
                        <option value="">Select gender</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                    </Select>
                </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField label="Phone" required error={errors.phone}>
                    <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+961-70-000000" />
                </FormField>
                <FormField label="Email">
                    <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField label="Blood Type">
                    <Select value={form.blood_type} onChange={e => set('blood_type', e.target.value)}>
                        <option value="">Unknown</option>
                        {BLOOD_TYPES.map(bt => <option key={bt}>{bt}</option>)}
                    </Select>
                </FormField>
                <FormField label="Address">
                    <Input value={form.address} onChange={e => set('address', e.target.value)} />
                </FormField>
            </div>

            <FormField label="Medical Notes">
                <Textarea
                    value={form.medical_notes}
                    onChange={e => set('medical_notes', e.target.value)}
                    placeholder="Allergies, chronic conditions…"
                />
            </FormField>

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit" loading={loading}>
                    {initial.patient_id ? 'Save Changes' : 'Register Patient'}
                </Button>
            </div>
        </form>
    );
}
