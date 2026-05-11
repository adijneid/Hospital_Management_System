import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import { patientService } from '../../services/patientService.js';
import { AppointmentStatusBadge } from '../common/StatusBadge.jsx';
import { formatDate, formatDateTime, calcAge } from '../../utils/formatters.js';
import Badge from '../common/Badge.jsx';

export default function PatientDetails({ patient }) {
    const [tab, setTab] = useState('info');
    const { data: appointments, loading } = useFetch(
        () => patientService.getAppointments(patient.patient_id),
        [patient.patient_id]
    );

    return (
        <div>
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
                    {patient.first_name[0]}{patient.last_name[0]}
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">
                        {patient.first_name} {patient.last_name}
                    </h3>
                    <p className="text-gray-500 text-sm">
                        {calcAge(patient.date_of_birth)} yrs • {patient.gender || 'N/A'} •&nbsp;
                        {patient.blood_type
                            ? <Badge color="red">{patient.blood_type}</Badge>
                            : <span>Blood type unknown</span>
                        }
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-4 flex gap-4">
                {['info', 'appointments'].map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`pb-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                            tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {tab === 'info' && (
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div><dt className="text-gray-500">Date of Birth</dt><dd className="font-medium">{formatDate(patient.date_of_birth)}</dd></div>
                    <div><dt className="text-gray-500">Phone</dt><dd className="font-medium">{patient.phone || '—'}</dd></div>
                    <div><dt className="text-gray-500">Email</dt><dd className="font-medium">{patient.email || '—'}</dd></div>
                    <div><dt className="text-gray-500">Address</dt><dd className="font-medium">{patient.address || '—'}</dd></div>
                    <div className="col-span-2">
                        <dt className="text-gray-500">Medical Notes</dt>
                        <dd className="font-medium mt-1 p-3 bg-yellow-50 rounded-lg text-yellow-800">
                            {patient.medical_notes || 'None'}
                        </dd>
                    </div>
                </dl>
            )}

            {tab === 'appointments' && (
                <div>
                    {loading ? (
                        <div className="space-y-2">
                            {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
                        </div>
                    ) : !appointments?.length ? (
                        <p className="text-gray-400 text-center py-8">No appointments on record.</p>
                    ) : (
                        <div className="space-y-2">
                            {appointments.map(appt => (
                                <div key={appt.appointment_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                                    <div>
                                        <p className="font-medium">{formatDateTime(appt.scheduled_start)}</p>
                                        <p className="text-gray-500">{appt.reason || 'No reason specified'}</p>
                                    </div>
                                    <AppointmentStatusBadge status={appt.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
