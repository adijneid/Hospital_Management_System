import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { prescriptionService } from '../../services/prescriptionService.js';
import { FormField, Input, Textarea } from '../common/FormField.jsx';
import Button from '../common/Button.jsx';
import toast from 'react-hot-toast';

const EMPTY_FORM = { medication: '', dosage: '', frequency: '', duration: '', instructions: '' };

/**
 * Renders inside an existing <Modal> wrapper. Lists the prescriptions for the
 * given appointment, lets the appointment's owning doctor add/edit/remove
 * items, and offers a "Download PDF" button to anyone authenticated.
 *
 * The form at the bottom doubles as add/edit: clicking Edit on a row pre-fills
 * the form with that row's values and switches the submit button to "Save
 * changes" — Cancel returns to add mode.
 */
export default function PrescriptionModal({ appointment }) {
    const { user } = useAuth();
    const isOwningDoctor = user?.role === 'doctor' && user?.doctorId === appointment?.doctor_id;

    const [items, setItems] = useState(null);   // null = loading, [] = empty
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const formRef = useRef(null);

    const refresh = useCallback(async () => {
        try {
            setItems(await prescriptionService.list(appointment.appointment_id));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to load prescriptions');
            setItems([]);
        }
    }, [appointment.appointment_id]);

    useEffect(() => { refresh(); }, [refresh]);

    function set(field, value) {
        setForm(f => ({ ...f, [field]: value }));
        if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
    }

    function startEdit(rx) {
        setEditingId(rx.prescription_id);
        setForm({
            medication: rx.medication ?? '',
            dosage: rx.dosage ?? '',
            frequency: rx.frequency ?? '',
            duration: rx.duration ?? '',
            instructions: rx.instructions ?? '',
        });
        setErrors({});
        // Scroll the form into view so the doctor sees what they're editing
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 0);
    }

    function cancelEdit() {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setErrors({});
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.medication.trim()) {
            setErrors({ medication: 'Required' });
            return;
        }
        const payload = {
            medication: form.medication.trim(),
            dosage: form.dosage.trim() || undefined,
            frequency: form.frequency.trim() || undefined,
            duration: form.duration.trim() || undefined,
            instructions: form.instructions.trim() || undefined,
        };
        setSaving(true);
        try {
            if (editingId) {
                await prescriptionService.update(editingId, payload);
                toast.success('Prescription updated');
            } else {
                await prescriptionService.create(appointment.appointment_id, payload);
                toast.success('Prescription added');
            }
            cancelEdit();
            await refresh();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save prescription');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(rxId) {
        try {
            await prescriptionService.delete(rxId);
            // If the row being deleted was open in the editor, reset the form
            if (editingId === rxId) cancelEdit();
            await refresh();
            toast.success('Prescription removed');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete');
        }
    }

    async function handleDownload() {
        setDownloading(true);
        try {
            await prescriptionService.downloadPdf(appointment.appointment_id);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to download PDF');
        } finally {
            setDownloading(false);
        }
    }

    return (
        <div className="space-y-5">
            {/* Header summary */}
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                <p>
                    <span className="text-gray-500">Patient: </span>
                    <span className="font-medium">{appointment.patient_name || appointment.patient_id}</span>
                </p>
                {appointment.doctor_name && (
                    <p>
                        <span className="text-gray-500">Doctor: </span>
                        <span className="font-medium">Dr. {appointment.doctor_name}</span>
                    </p>
                )}
                <p>
                    <span className="text-gray-500">Visit: </span>
                    <span className="font-medium">
                        {new Date(appointment.scheduled_start).toLocaleString()}
                    </span>
                </p>
            </div>

            {/* List */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">Medications</h3>
                    {items?.length > 0 && (
                        <Button variant="outline" size="sm" loading={downloading} onClick={handleDownload}>
                            ⬇ Download PDF
                        </Button>
                    )}
                </div>
                {items === null ? (
                    <div className="space-y-2">
                        {[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
                    </div>
                ) : items.length === 0 ? (
                    <p className="text-sm text-gray-400 italic py-4 text-center">
                        No prescriptions yet for this visit.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {items.map((rx, i) => {
                            const isEditingThisRow = editingId === rx.prescription_id;
                            return (
                                <li
                                    key={rx.prescription_id}
                                    className={`border rounded-lg p-3 ${isEditingThisRow ? 'border-blue-300 bg-blue-50/40' : 'border-gray-100'}`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900">
                                                {i + 1}. {rx.medication}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-0.5">
                                                {[rx.dosage, rx.frequency, rx.duration].filter(Boolean).join(' · ')}
                                            </p>
                                            {rx.instructions && (
                                                <p className="text-xs text-gray-500 italic mt-1">
                                                    {rx.instructions}
                                                </p>
                                            )}
                                        </div>
                                        {isOwningDoctor && (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => startEdit(rx)}
                                                    title="Edit"
                                                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(rx.prescription_id)}
                                                    title="Remove"
                                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Add / edit form (doctor only) */}
            {isOwningDoctor && (
                <form ref={formRef} onSubmit={handleSubmit} className="border-t border-gray-100 pt-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">
                        {editingId ? 'Edit prescription' : 'Add a medication'}
                    </h3>
                    <FormField label="Medication" required error={errors.medication}>
                        <Input value={form.medication} onChange={e => set('medication', e.target.value)}
                            placeholder="e.g. Amoxicillin" />
                    </FormField>
                    <div className="grid grid-cols-3 gap-3">
                        <FormField label="Dosage">
                            <Input value={form.dosage} onChange={e => set('dosage', e.target.value)}
                                placeholder="500 mg" />
                        </FormField>
                        <FormField label="Frequency">
                            <Input value={form.frequency} onChange={e => set('frequency', e.target.value)}
                                placeholder="3x daily" />
                        </FormField>
                        <FormField label="Duration">
                            <Input value={form.duration} onChange={e => set('duration', e.target.value)}
                                placeholder="7 days" />
                        </FormField>
                    </div>
                    <FormField label="Instructions">
                        <Textarea value={form.instructions} rows={2}
                            onChange={e => set('instructions', e.target.value)}
                            placeholder="Take with food, avoid alcohol…" />
                    </FormField>
                    <div className="flex justify-end gap-2 pt-1">
                        {editingId && (
                            <Button type="button" variant="secondary" onClick={cancelEdit}>Cancel edit</Button>
                        )}
                        <Button type="submit" loading={saving}>
                            {editingId ? 'Save changes' : '+ Add Prescription'}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}
