import Badge from './Badge.jsx';

const appointmentColors = { scheduled: 'blue', completed: 'green', cancelled: 'red' };
const roomColors = { available: 'green', occupied: 'red', maintenance: 'yellow' };

export function AppointmentStatusBadge({ status }) {
    return <Badge color={appointmentColors[status] || 'gray'}>{status}</Badge>;
}

export function RoomStatusBadge({ status }) {
    return <Badge color={roomColors[status] || 'gray'}>{status}</Badge>;
}
