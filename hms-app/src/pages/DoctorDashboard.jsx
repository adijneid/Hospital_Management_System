import { useCallback, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { useAuth } from '../hooks/useAuth.js';
import { useFetch } from '../hooks/useFetch.js';
import { useAppointmentEvents } from '../realtime/useAppointmentEvents.js';
import { appointmentService } from '../services/appointmentService.js';
import { doctorService } from '../services/doctorService.js';
import { TODAYS_APPOINTMENTS } from '../graphql/queries.js';
import Layout from '../components/common/Layout.jsx';
import Card from '../components/common/Card.jsx';
import Modal from '../components/common/Modal.jsx';
import StatCard from '../components/common/StatCard.jsx';
import DoctorSchedule from '../components/doctors/DoctorSchedule.jsx';
import PrescriptionModal from '../components/appointments/PrescriptionModal.jsx';
import { AppointmentStatusBadge } from '../components/common/StatusBadge.jsx';
import { formatTime } from '../utils/formatters.js';
import toast from 'react-hot-toast';

export default function DoctorDashboard() {
    const { user } = useAuth();
    const doctorId = user?.doctorId;

    const { data, loading: loadingToday, refetch: refetchToday } = useQuery(
        TODAYS_APPOINTMENTS,
        { variables: { doctorId }, skip: !doctorId }
    );
    const today = data?.todaysAppointments ?? [];

    const { data: allAppts, loading: loadingAll, refetch: refetchAll } = useFetch(
        () => doctorId ? doctorService.getAppointments(doctorId) : Promise.resolve([]),
        [doctorId]
    );

    useAppointmentEvents(useCallback(() => {
        refetchToday();
        refetchAll();
    }, [refetchToday, refetchAll]));

    const totalScheduled = allAppts?.filter(a => a.status === 'scheduled').length ?? 0;

    const [rxAppt, setRxAppt] = useState(null);
    function openRx(appt) {
        // PrescriptionModal renders patient_name / doctor_name flat; today's
        // GraphQL row has them nested. Synthesize the flat view here.
        setRxAppt({
            ...appt,
            patient_name: appt.patient
                ? `${appt.patient.first_name} ${appt.patient.last_name}`
                : null,
            doctor_name: appt.doctor
                ? `${appt.doctor.first_name} ${appt.doctor.last_name}`
                : null,
        });
    }

    async function handleStatusChange(appt, status) {
        try {
            await appointmentService.updateStatus(appt.appointment_id, status);
            toast.success(`Appointment marked as ${status}`);
            refetchToday();
            refetchAll();
        } catch {
            toast.error('Failed to update status');
        }
    }

    return (
        <Layout title="My Schedule">
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <StatCard
                        label="Today's Appointments"
                        value={today?.length}
                        icon="📅"
                        color="blue"
                        loading={loadingToday}
                    />
                    <StatCard
                        label="Total Scheduled"
                        value={totalScheduled}
                        icon="⏰"
                        color="yellow"
                        loading={loadingAll}
                    />
                </div>

                <Card title="Today's Appointments">
                    {loadingToday ? (
                        <div className="space-y-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                            ))}
                        </div>
                    ) : !today?.length ? (
                        <p className="text-gray-400 text-center py-8">No appointments today.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead>
                                    <tr>
                                        {['Time', 'Patient', 'Reason', 'Room', 'Status', 'Actions'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {today.map(appt => (
                                        <tr key={appt.appointment_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                                                {formatTime(appt.scheduled_start)} – {formatTime(appt.scheduled_end)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {appt.patient ? `${appt.patient.first_name} ${appt.patient.last_name}` : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{appt.reason || '—'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{appt.room?.room_number || '—'}</td>
                                            <td className="px-4 py-3"><AppointmentStatusBadge status={appt.status} /></td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    {appt.status === 'scheduled' && (
                                                        <>
                                                            <button onClick={() => handleStatusChange(appt, 'completed')} title="Complete"
                                                                className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </button>
                                                            <button onClick={() => handleStatusChange(appt, 'cancelled')} title="Cancel"
                                                                className="p-1.5 rounded-lg text-yellow-600 hover:bg-yellow-50 transition-colors">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                                </svg>
                                                            </button>
                                                        </>
                                                    )}
                                                    <button onClick={() => openRx(appt)} title="Prescriptions"
                                                        className="px-2 py-1 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors text-xs font-semibold">
                                                        ℞
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                {doctorId && (
                    <Card title="Upcoming Schedule (Next 30 Days)">
                        <DoctorSchedule doctorId={doctorId} />
                    </Card>
                )}
            </div>

            <Modal
                open={Boolean(rxAppt)}
                onClose={() => setRxAppt(null)}
                title="Prescriptions"
                size="lg"
            >
                {rxAppt && <PrescriptionModal appointment={rxAppt} onClose={() => setRxAppt(null)} />}
            </Modal>
        </Layout>
    );
}
