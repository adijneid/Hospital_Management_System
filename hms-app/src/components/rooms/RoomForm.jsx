import { useState } from 'react';
import { FormField, Input, Select } from '../common/FormField.jsx';
import Button from '../common/Button.jsx';

export default function RoomForm({ initial = {}, onSubmit, onCancel, loading = false }) {
    const [form, setForm] = useState({
        room_number: initial.room_number || '',
        room_type:   initial.room_type   || 'consultation',
        floor:       initial.floor       != null ? String(initial.floor) : '',
        capacity:    initial.capacity    != null ? String(initial.capacity) : '1',
    });
    const [errors, setErrors] = useState({});

    function set(field, value) {
        setForm(f => ({ ...f, [field]: value }));
        if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
    }

    function validate() {
        const errs = {};
        if (!form.room_number.trim()) errs.room_number = 'Room number is required';
        if (!form.capacity || isNaN(Number(form.capacity))) errs.capacity = 'Valid capacity required';
        return errs;
    }

    function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        onSubmit({
            room_number: form.room_number,
            room_type:   form.room_type,
            floor:       form.floor ? Number(form.floor) : null,
            capacity:    Number(form.capacity),
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField label="Room Number" required error={errors.room_number}>
                    <Input value={form.room_number} onChange={e => set('room_number', e.target.value)} placeholder="e.g. 101" />
                </FormField>
                <FormField label="Floor">
                    <Input type="number" value={form.floor} onChange={e => set('floor', e.target.value)} min="0" placeholder="0" />
                </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField label="Type">
                    <Select value={form.room_type} onChange={e => set('room_type', e.target.value)}>
                        <option value="consultation">Consultation</option>
                        <option value="treatment">Treatment</option>
                        <option value="surgery">Surgery</option>
                    </Select>
                </FormField>
                <FormField label="Capacity" required error={errors.capacity}>
                    <Input type="number" value={form.capacity} onChange={e => set('capacity', e.target.value)} min="1" />
                </FormField>
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit" loading={loading}>
                    {initial.room_id ? 'Save Changes' : 'Add Room'}
                </Button>
            </div>
        </form>
    );
}
