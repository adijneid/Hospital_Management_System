import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useFetch } from '../hooks/useFetch.js';
import { doctorService } from '../services/doctorService.js';
import Layout from '../components/common/Layout.jsx';
import Card from '../components/common/Card.jsx';
import Modal from '../components/common/Modal.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import Badge from '../components/common/Badge.jsx';
import PrescriptionModal from '../components/appointments/PrescriptionModal.jsx';
import { AppointmentStatusBadge } from '../components/common/StatusBadge.jsx';
import { formatDate, formatTime, calcAge } from '../utils/formatters.js';

export default function DoctorPatientsPage() {
    const { user } = useAuth();
    const doctorId = user?.doctorId;

    const { data: patients, loading } = useFetch(
        () => doctorId ? doctorService.getPatients(doctorId) : Promise.resolve([]),
        [doctorId]
    );

    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);

    const filtered = patients?.filter(p => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            p.first_name.toLowerCase().includes(q) ||
            p.last_name.toLowerCase().includes(q) ||
            p.phone?.includes(q)
        );
    }) ?? [];

    return (
        <Layout title="My Patients">
            <div className="space-y-4">
                <SearchBar
                    value={search}
                    onChange={setSearch}
                    placeholder="Search by name or phone…"
                    className="max-w-sm"
                />

                <Card>
                    {loading ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
                        </div>
                    ) : !filtered.length ? (
                        <p className="text-center py-12 text-gray-400">
                            {search ? 'No patients match your search.' : 'No patients yet.'}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead>
                                    <tr>
                                        {['Name', 'Age', 'Gender', 'Blood Type', 'Phone', 'Visits', 'Last Visit'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map(p => (
                                        <tr key={p.patient_id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelected(p)}>
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-blue-600">{p.first_name} {p.last_name}</p>
                                                {p.medical_notes && (
                                                    <p className="text-xs text-yellow-700 mt-0.5">{p.medical_notes}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{calcAge(p.date_of_birth) ?? '—'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{p.gender || '—'}</td>
                                            <td className="px-4 py-3">
                                                {p.blood_type ? <Badge color="red">{p.blood_type}</Badge> : <span className="text-gray-300 text-sm">—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{p.phone || '—'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700 font-medium">{p.visit_count}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{p.last_visit ? formatDate(p.last_visit) : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>

            <Modal
                open={Boolean(selected)}
                onClose={() => setSelected(null)}
                title={selected ? `${selected.first_name} ${selected.last_name} — Visit History` : ''}
                size="lg"
            >
                {selected && <PatientHistory doctorId={doctorId} patient={selected} />}
            </Modal>
        </Layout>
    );
}

function PatientHistory({ doctorId, patient }) {
    const { data: history, loading } = useFetch(
        () => doctorService.getPatientHistory(doctorId, patient.patient_id),
        [doctorId, patient.patient_id]
    );

    // Rx button per visit. The history rows don't carry doctor_id (it's the
    // logged-in doctor by definition for this query), so synthesize what
    // PrescriptionModal expects.
    const [rxAppt, setRxAppt] = useState(null);

    if (loading) {
        return <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}</div>;
    }

    if (!history?.length) {
        return <p className="text-gray-400 text-center py-8">No visit history.</p>;
    }

    return (
        <div className="space-y-4">
            {/* Patient info summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-xl text-sm">
                <div>
                    <p className="text-gray-400 text-xs">Age</p>
                    <p className="font-medium">{calcAge(patient.date_of_birth) ?? '—'}</p>
                </div>
                <div>
                    <p className="text-gray-400 text-xs">Gender</p>
                    <p className="font-medium">{patient.gender || '—'}</p>
                </div>
                <div>
                    <p className="text-gray-400 text-xs">Blood Type</p>
                    <p className="font-medium">{patient.blood_type || '—'}</p>
                </div>
                <div>
                    <p className="text-gray-400 text-xs">Phone</p>
                    <p className="font-medium">{patient.phone || '—'}</p>
                </div>
            </div>
            {patient.medical_notes && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                    <span className="font-medium">Medical Notes:</span> {patient.medical_notes}
                </div>
            )}

            {/* Visit history */}
            <div className="space-y-2">
                {history.map(appt => (
                    <div key={appt.appointment_id} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                {formatDate(appt.scheduled_start)} • {formatTime(appt.scheduled_start)} – {formatTime(appt.scheduled_end)}
                            </p>
                            <p className="text-sm text-gray-600 mt-0.5">{appt.reason || 'No reason specified'}</p>
                            {appt.room_number && <p className="text-xs text-gray-400 mt-0.5">Room {appt.room_number}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setRxAppt({
                                    ...appt,
                                    doctor_id: doctorId,
                                    patient_name: `${patient.first_name} ${patient.last_name}`,
                                })}
                                title="Prescriptions"
                                className="px-2 py-1 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors text-sm font-semibold"
                            >
                                ℞
                            </button>
                            <AppointmentStatusBadge status={appt.status} />
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                open={Boolean(rxAppt)}
                onClose={() => setRxAppt(null)}
                title="Prescriptions"
                size="lg"
            >
                {rxAppt && <PrescriptionModal appointment={rxAppt} onClose={() => setRxAppt(null)} />}
            </Modal>
        </div>
    );
}
