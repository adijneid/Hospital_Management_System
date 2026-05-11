import { useFetch } from '../../hooks/useFetch.js';
import { roomService } from '../../services/roomService.js';
import { AppointmentStatusBadge } from '../common/StatusBadge.jsx';
import { formatDate, formatTime } from '../../utils/formatters.js';

export default function RoomSchedule({ roomId }) {
    const { data: schedule, loading } = useFetch(
        () => roomService.getSchedule(roomId),
        [roomId]
    );

    if (loading) {
        return (
            <div className="space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}
            </div>
        );
    }

    if (!schedule?.length) {
        return <p className="text-gray-400 text-center py-8">No upcoming appointments for this room.</p>;
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
                            Dr. {appt.doctor_first_name} {appt.doctor_last_name} — {appt.doctor_specialty}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {formatDate(appt.scheduled_start)} • {formatTime(appt.scheduled_start)} – {formatTime(appt.scheduled_end)}
                        </p>
                        {appt.reason && <p className="text-xs text-gray-400 mt-0.5 italic">{appt.reason}</p>}
                    </div>
                    <AppointmentStatusBadge status={appt.status} />
                </div>
            ))}
        </div>
    );
}
