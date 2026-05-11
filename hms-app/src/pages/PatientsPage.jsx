import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import {
    PATIENTS_QUERY,
    CREATE_PATIENT_MUTATION,
    UPDATE_PATIENT_MUTATION,
    DELETE_PATIENT_MUTATION,
} from '../graphql/queries.js';
import { patientService } from '../services/patientService.js';
import Layout from '../components/common/Layout.jsx';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import PatientForm from '../components/patients/PatientForm.jsx';
import PatientDetails from '../components/patients/PatientDetails.jsx';
import { formatDate, calcAge } from '../utils/formatters.js';
import Badge from '../components/common/Badge.jsx';
import toast from 'react-hot-toast';

// Strip the Apollo cache `__typename` field and any extras the backend doesn't accept.
function toInput(data) {
    const { __typename, patient_id, ...rest } = data;
    return rest;
}

export default function PatientsPage() {
    const { data, loading, refetch } = useQuery(PATIENTS_QUERY, {
        variables: { limit: 200, offset: 0 },
        fetchPolicy: 'cache-and-network',
    });
    const patients = data?.patients;

    const [createPatient] = useMutation(CREATE_PATIENT_MUTATION);
    const [updatePatient] = useMutation(UPDATE_PATIENT_MUTATION);
    const [deletePatient] = useMutation(DELETE_PATIENT_MUTATION);

    const [search, setSearch]       = useState('');
    const [page, setPage]           = useState(1);
    const [selected, setSelected]   = useState(null);
    const [editing, setEditing]     = useState(null);
    const [deleting, setDeleting]   = useState(null);
    const [saving, setSaving]       = useState(false);
    const [deletingOp, setDeletingOp] = useState(false);

    const perPage = 10;

    const filtered = patients?.filter(p => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            p.first_name.toLowerCase().includes(q) ||
            p.last_name.toLowerCase().includes(q) ||
            p.phone?.includes(q) ||
            p.email?.toLowerCase().includes(q)
        );
    }) ?? [];

    const totalPages = Math.ceil(filtered.length / perPage);
    const paginated = filtered.slice((page - 1) * perPage, page * perPage);

    async function handleSave(formData) {
        setSaving(true);
        try {
            if (editing?.patient_id) {
                await updatePatient({
                    variables: { id: editing.patient_id, input: toInput(formData) },
                });
                toast.success('Patient updated');
            } else {
                await createPatient({ variables: { input: toInput(formData) } });
                toast.success('Patient registered');
            }
            setEditing(null);
            await refetch();
        } catch (err) {
            toast.error(err.graphQLErrors?.[0]?.message || err.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!deleting) return;
        setDeletingOp(true);
        try {
            // Block delete if the patient has appointments — REST endpoint stays
            // (no GraphQL query exists for this guard).
            const appointments = await patientService.getAppointments(deleting.patient_id);
            if (appointments && appointments.length > 0) {
                toast.error(
                    `Cannot delete — ${deleting.first_name} ${deleting.last_name} has ${appointments.length} appointment(s) assigned.`
                );
                return;
            }
            await deletePatient({ variables: { id: deleting.patient_id } });
            toast.success('Patient deleted');
            setDeleting(null);
            await refetch();
        } catch (err) {
            toast.error(err.graphQLErrors?.[0]?.message || err.message || 'Failed to delete patient');
        } finally {
            setDeletingOp(false);
        }
    }

    return (
        <Layout title="Patients">
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <SearchBar
                        value={search}
                        onChange={v => { setSearch(v); setPage(1); }}
                        placeholder="Search by name, phone, or email…"
                        className="flex-1 max-w-sm"
                    />
                    <Button onClick={() => setEditing({})}>+ New Patient</Button>
                </div>

                <Card>
                    {loading ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
                        </div>
                    ) : !filtered.length ? (
                        <p className="text-center py-12 text-gray-400">
                            {search ? 'No patients match your search.' : 'No patients registered yet.'}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead>
                                    <tr>
                                        {['Name', 'DOB / Age', 'Gender', 'Blood Type', 'Phone', 'Notes', ''].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {paginated.map(p => (
                                        <tr key={p.patient_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => setSelected(p)}
                                                    className="font-semibold text-blue-600 hover:underline text-left"
                                                >
                                                    {p.first_name} {p.last_name}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                                {formatDate(p.date_of_birth)} ({calcAge(p.date_of_birth)} yrs)
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{p.gender || '—'}</td>
                                            <td className="px-4 py-3">
                                                {p.blood_type
                                                    ? <Badge color="red">{p.blood_type}</Badge>
                                                    : <span className="text-gray-300 text-sm">—</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{p.phone || '—'}</td>
                                            <td className="px-4 py-3 text-sm text-yellow-700 max-w-xs truncate">
                                                {p.medical_notes || ''}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    <button onClick={() => setEditing(p)} title="Edit"
                                                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button onClick={() => setDeleting(p)} title="Delete"
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

            {/* Patient Form Modal */}
            <Modal
                open={Boolean(editing)}
                onClose={() => setEditing(null)}
                title={editing?.patient_id ? 'Edit Patient' : 'Register New Patient'}
                size="lg"
            >
                {editing && (
                    <PatientForm
                        initial={editing}
                        onSubmit={handleSave}
                        onCancel={() => setEditing(null)}
                        loading={saving}
                    />
                )}
            </Modal>

            {/* Patient Details Modal */}
            <Modal
                open={Boolean(selected)}
                onClose={() => setSelected(null)}
                title="Patient Details"
                size="lg"
            >
                {selected && <PatientDetails patient={selected} />}
            </Modal>

            {/* Delete Confirm */}
            <ConfirmDialog
                open={Boolean(deleting)}
                onClose={() => setDeleting(null)}
                onConfirm={handleDelete}
                title="Delete Patient"
                message={`Are you sure you want to delete ${deleting?.first_name} ${deleting?.last_name}? This cannot be undone.`}
                loading={deletingOp}
            />
        </Layout>
    );
}
