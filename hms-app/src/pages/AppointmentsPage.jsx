import { useCallback, useState } from 'react';
import { useFetch } from '../hooks/useFetch.js';
import { useAppointmentEvents } from '../realtime/useAppointmentEvents.js';
import { appointmentService } from '../services/appointmentService.js';
import Layout from '../components/common/Layout.jsx';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import AppointmentForm from '../components/appointments/AppointmentForm.jsx';
import PrescriptionModal from '../components/appointments/PrescriptionModal.jsx';
import { AppointmentStatusBadge } from '../components/common/StatusBadge.jsx';
import { formatDate, formatTime } from '../utils/formatters.js';
import toast from 'react-hot-toast';

export default function AppointmentsPage() {
    const { data: appointments, loading, refetch } = useFetch(() => appointmentService.getAll());

    useAppointmentEvents(useCallback(() => { refetch(); }, [refetch]));

    const [filter, setFilter]       = useState('all');
    const [sortDir, setSortDir]     = useState('asc');
    const [page, setPage]           = useState(1);
    const [editing, setEditing]     = useState(null);
    const [deleting, setDeleting]   = useState(null);
    const [saving, setSaving]       = useState(false);
    const [deletingOp, setDeletingOp] = useState(false);
    const [rxAppt, setRxAppt]       = useState(null);

    const perPage = 10;

    const filtered = appointments?.filter(a => {
        if (filter === 'all') return true;
        return a.status === filter;
    }) ?? [];

    const sorted = [...filtered].sort((a, b) => {
        const diff = new Date(a.scheduled_start) - new Date(b.scheduled_start);
        return sortDir === 'asc' ? diff : -diff;
    });

    const totalPages = Math.ceil(sorted.length / perPage);
    const paginated = sorted.slice((page - 1) * perPage, page * perPage);

    function toggleSort() {
        setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        setPage(1);
    }

    async function handleSave(data) {
        setSaving(true);
        try {
            if (editing?.appointment_id) {
                await appointmentService.update(editing.appointment_id, data);
                toast.success('Appointment updated');
            } else {
                await appointmentService.create(data);
                toast.success('Appointment booked');
            }
            setEditing(null);
            refetch();
        } catch (err) {
            if (err.response?.status === 409) {
                throw err;
            }
            const msg = err.response?.data?.errors
                ? err.response.data.errors.map(e => e.msg).join(', ')
                : err.response?.data?.message || 'Failed to save';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        setDeletingOp(true);
        try {
            await appointmentService.delete(deleting.appointment_id);
            toast.success('Appointment deleted');
            setDeleting(null);
            refetch();
        } catch {
            toast.error('Failed to delete appointment');
        } finally {
            setDeletingOp(false);
        }
    }

    async function handleStatusChange(appt, status) {
        try {
            await appointmentService.updateStatus(appt.appointment_id, status);
            toast.success(`Appointment marked as ${status}`);
            refetch();
        } catch {
            toast.error('Failed to update status');
        }
    }

    async function handleSendReminder(appt) {
        try {
            const res = await appointmentService.sendReminder(appt.appointment_id, true);
            if (res?.status === 'skipped') {
                toast(res.reason ?? 'Reminder skipped', { icon: 'ℹ️' });
                return;
            }
            if (res?.previewUrl) {
                // Dev (Ethereal): clickable toast opens the captured email preview
                toast.success(
                    (t) => (
                        <span>
                            Reminder sent —{' '}
                            <a
                                href={res.previewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="underline text-blue-600"
                                onClick={() => toast.dismiss(t.id)}
                            >
                                preview email
                            </a>
                        </span>
                    ),
                    { duration: 8000 },
                );
            } else {
                toast.success('Reminder sent');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send reminder');
        }
    }

    return (
        <Layout title="Appointments">
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex gap-2">
                        {['all', 'scheduled', 'completed', 'cancelled'].map(f => (
                            <button
                                key={f}
                                onClick={() => { setFilter(f); setPage(1); }}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                                    filter === f
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <Button onClick={() => setEditing({})}>+ Book Appointment</Button>
                </div>

                <Card>
                    {loading ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
                        </div>
                    ) : !filtered.length ? (
                        <p className="text-center py-12 text-gray-400">No appointments found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                            <button
                                                type="button"
                                                onClick={toggleSort}
                                                title={`Sort by date & time (${sortDir === 'asc' ? 'oldest first' : 'newest first'})`}
                                                className="inline-flex items-center gap-1 hover:text-gray-700 transition-colors"
                                            >
                                                Date &amp; Time
                                                <span aria-hidden="true" className="text-gray-400">
                                                    {sortDir === 'asc' ? '▲' : '▼'}
                                                </span>
                                            </button>
                                        </th>
                                        {['Patient', 'Doctor', 'Room', 'Reason', 'Status', 'Actions'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {paginated.map(appt => (
                                        <tr
                                            key={appt.appointment_id}
                                            onClick={() => setRxAppt(appt)}
                                            title="Open prescriptions"
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                            <td className="px-4 py-3 text-sm whitespace-nowrap">
                                                <p className="font-medium">{formatDate(appt.scheduled_start)}</p>
                                                <p className="text-gray-500">{formatTime(appt.scheduled_start)} – {formatTime(appt.scheduled_end)}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{appt.patient_name || appt.patient_id}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                <span>Dr. {appt.doctor_name || appt.doctor_id}</span>
                                                {appt.doctor_specialty && <span className="block text-xs text-gray-400">{appt.doctor_specialty}</span>}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{appt.room_number || '—'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{appt.reason || '—'}</td>
                                            <td className="px-4 py-3"><AppointmentStatusBadge status={appt.status} /></td>
                                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex gap-1">
                                                    {appt.status === 'scheduled' && (
                                                        <>
                                                            <button onClick={() => handleStatusChange(appt, 'completed')}
                                                                title="Complete"
                                                                className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </button>
                                                            <button onClick={() => handleStatusChange(appt, 'cancelled')}
                                                                title="Cancel"
                                                                className="p-1.5 rounded-lg text-yellow-600 hover:bg-yellow-50 transition-colors">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                                </svg>
                                                            </button>
                                                            <button onClick={() => handleSendReminder(appt)}
                                                                title="Send reminder email"
                                                                className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                </svg>
                                                            </button>
                                                        </>
                                                    )}
                                                    <button onClick={() => setEditing(appt)}
                                                        title="Edit"
                                                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button onClick={() => setDeleting(appt)}
                                                        title="Delete"
                                                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-500">
                                Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
                            </p>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Prev
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                            p === page
                                                ? 'bg-blue-600 text-white'
                                                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            <Modal
                open={Boolean(rxAppt)}
                onClose={() => setRxAppt(null)}
                title="Prescriptions"
                size="lg"
            >
                {rxAppt && <PrescriptionModal appointment={rxAppt} onClose={() => setRxAppt(null)} />}
            </Modal>

            <Modal
                open={Boolean(editing)}
                onClose={() => setEditing(null)}
                title={editing?.appointment_id ? 'Edit Appointment' : 'Book Appointment'}
                size="lg"
            >
                {editing && (
                    <AppointmentForm
                        initial={editing}
                        onSubmit={handleSave}
                        onCancel={() => setEditing(null)}
                        loading={saving}
                    />
                )}
            </Modal>

            <ConfirmDialog
                open={Boolean(deleting)}
                onClose={() => setDeleting(null)}
                onConfirm={handleDelete}
                title="Delete Appointment"
                message="Are you sure you want to delete this appointment?"
                loading={deletingOp}
            />
        </Layout>
    );
}
