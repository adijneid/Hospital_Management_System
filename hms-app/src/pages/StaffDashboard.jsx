import { useCallback } from 'react';
import { useQuery } from '@apollo/client/react';
import { useFetch } from '../hooks/useFetch.js';
import { useAppointmentEvents } from '../realtime/useAppointmentEvents.js';
import { appointmentService } from '../services/appointmentService.js';
import { DASHBOARD_STATS } from '../graphql/queries.js';
import Layout from '../components/common/Layout.jsx';
import StatCard from '../components/common/StatCard.jsx';
import Card from '../components/common/Card.jsx';
import { AppointmentStatusBadge } from '../components/common/StatusBadge.jsx';
import { formatTime } from '../utils/formatters.js';

export default function StaffDashboard() {
    const { data: statsData, loading: loadingStats, refetch: refetchStats } = useQuery(DASHBOARD_STATS);
    const stats = statsData?.dashboardStats;
    const roomStats = stats?.roomStats;

    const { data: today, loading: loadingToday, refetch: refetchToday } = useFetch(() => appointmentService.getToday());

    useAppointmentEvents(useCallback(() => {
        refetchStats();
        refetchToday();
    }, [refetchStats, refetchToday]));

    return (
        <Layout title="Dashboard">
            <div className="space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Today's Appointments"
                        value={stats?.todayCount}
                        icon="📅"
                        color="blue"
                        loading={loadingStats}
                    />
                    <StatCard
                        label="Total Patients"
                        value={stats?.patientCount}
                        icon="👤"
                        color="purple"
                        loading={loadingStats}
                    />
                    <StatCard
                        label="Scheduled"
                        value={stats?.scheduledCount}
                        icon="⏰"
                        color="yellow"
                        loading={loadingStats}
                    />
                    <StatCard
                        label="Available Rooms"
                        value={roomStats?.available}
                        icon="🏥"
                        color="green"
                        loading={loadingStats}
                    />
                </div>

                {/* Room Stats */}
                {!loadingStats && roomStats && (
                    <Card title="Room Overview">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3 bg-green-50 rounded-xl">
                                <p className="text-2xl font-bold text-green-600">{roomStats.available}</p>
                                <p className="text-xs text-gray-500 mt-1">Available</p>
                            </div>
                            <div className="p-3 bg-red-50 rounded-xl">
                                <p className="text-2xl font-bold text-red-600">{roomStats.occupied}</p>
                                <p className="text-xs text-gray-500 mt-1">Occupied</p>
                            </div>
                            <div className="p-3 bg-yellow-50 rounded-xl">
                                <p className="text-2xl font-bold text-yellow-600">{roomStats.maintenance}</p>
                                <p className="text-xs text-gray-500 mt-1">Maintenance</p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Today's Appointments */}
                <Card title="Today's Appointments">
                    {loadingToday ? (
                        <div className="space-y-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
                            ))}
                        </div>
                    ) : !today?.length ? (
                        <p className="text-gray-400 text-center py-8">No appointments scheduled for today.</p>
                    ) : (
                        <div className="space-y-2">
                            {today.map(appt => (
                                <div key={appt.appointment_id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <p className="font-semibold text-gray-900 truncate">
                                                    {appt.patient_name}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Dr. {appt.doctor_name} • {appt.doctor_specialty}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 ml-4">
                                        <p className="text-sm font-medium text-gray-700">
                                            {formatTime(appt.scheduled_start)} – {formatTime(appt.scheduled_end)}
                                        </p>
                                        <AppointmentStatusBadge status={appt.status} />
                                        {appt.room_number && (
                                            <span className="text-xs text-gray-400">Room {appt.room_number}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </Layout>
    );
}
