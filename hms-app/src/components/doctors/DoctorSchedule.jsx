import { useFetch } from '../../hooks/useFetch.js';
import { doctorService } from '../../services/doctorService.js';
import { AppointmentStatusBadge } from '../common/StatusBadge.jsx';
import { formatDate, formatTime } from '../../utils/formatters.js';

export default function DoctorSchedule({ doctorId }) {
    const today = new Date().toISOString().split('T')[0];
    const inMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const { data: schedule, loading } = useFetch(
        () => doctorService.getSchedule(doctorId, today, inMonth),
        [doctorId]
    );

    if (loading) {
        return (
            <div className="space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}
            </div>
        );
    }

    if (!schedule?.length) {
        return <p className="text-gray-400 text-center py-8">No upcoming appointments.</p>;
    }

    return (
        <div className="space-y-2">
            {schedule.map(appt => (
                <div key={appt.appointment_id} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div>
                        <p className="font-semibold text-gray-900">
                            {appt.patient_first_name} {appt.patient_last_name}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {formatDate(appt.scheduled_start)} • {formatTime(appt.scheduled_start)} – {formatTime(appt.scheduled_end)}
                        </p>
                        {appt.reason && <p className="text-xs text-gray-400 mt-0.5 italic">{appt.reason}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <AppointmentStatusBadge status={appt.status} />
                        {appt.room_number && (
                            <span className="text-xs text-gray-400">Room {appt.room_number}</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
