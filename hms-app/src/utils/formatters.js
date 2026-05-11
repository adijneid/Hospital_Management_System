// Date / time formatters using native Intl API

export function formatDate(date) {
    if (!date) return '—';
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        .format(new Date(date));
}

export function formatTime(date) {
    if (!date) return '—';
    return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
        .format(new Date(date));
}

export function formatDateTime(date) {
    if (!date) return '—';
    return `${formatDate(date)} ${formatTime(date)}`;
}

export function calcAge(dob) {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

export function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export function statusColor(status) {
    switch (status) {
        case 'scheduled':  return 'bg-blue-100 text-blue-800';
        case 'completed':  return 'bg-green-100 text-green-800';
        case 'cancelled':  return 'bg-red-100 text-red-800';
        default:           return 'bg-gray-100 text-gray-800';
    }
}

export function roomStatusColor(status) {
    switch (status) {
        case 'available':    return 'bg-green-100 text-green-800 border-green-200';
        case 'occupied':     return 'bg-red-100 text-red-800 border-red-200';
        case 'maintenance':  return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        default:             return 'bg-gray-100 text-gray-800 border-gray-200';
    }
}

export function roomTypeIcon(type) {
    switch (type) {
        case 'consultation': return '🩺';
        case 'treatment':    return '💉';
        case 'surgery':      return '🔪';
        default:             return '🏥';
    }
}
