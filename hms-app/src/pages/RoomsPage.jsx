import { useCallback, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import {
    ROOMS_QUERY,
    CREATE_ROOM_MUTATION,
    UPDATE_ROOM_MUTATION,
    DELETE_ROOM_MUTATION,
} from '../graphql/queries.js';
import { useFetch } from '../hooks/useFetch.js';
import { useRoomEvents } from '../realtime/useAppointmentEvents.js';
import { roomService } from '../services/roomService.js';
import Layout from '../components/common/Layout.jsx';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import RoomGrid from '../components/rooms/RoomGrid.jsx';
import RoomForm from '../components/rooms/RoomForm.jsx';
import RoomSchedule from '../components/rooms/RoomSchedule.jsx';
import StatCard from '../components/common/StatCard.jsx';
import toast from 'react-hot-toast';

function toInput(data) {
    const { __typename, room_id, ...rest } = data;
    return rest;
}

export default function RoomsPage() {
    const { data, loading, refetch } = useQuery(ROOMS_QUERY, { fetchPolicy: 'cache-and-network' });
    const rooms = data?.rooms;

    // Stats endpoint stays REST — no GraphQL surface for it yet, and it's a single read.
    const { data: stats, loading: loadingStats, refetch: refetchStats } = useFetch(() => roomService.getStats());

    const [createRoom] = useMutation(CREATE_ROOM_MUTATION);
    const [updateRoom] = useMutation(UPDATE_ROOM_MUTATION);
    const [deleteRoom] = useMutation(DELETE_ROOM_MUTATION);

    useRoomEvents(useCallback(() => {
        refetch();
        refetchStats();
    }, [refetch, refetchStats]));

    const [editing, setEditing]         = useState(null);
    const [deleting, setDeleting]       = useState(null);
    const [viewSchedule, setViewSchedule] = useState(null);
    const [saving, setSaving]           = useState(false);
    const [deletingOp, setDeletingOp]   = useState(false);

    function handleUpdate() {
        refetch();
        refetchStats();
    }

    async function handleSave(formData) {
        setSaving(true);
        try {
            if (editing?.room_id) {
                await updateRoom({
                    variables: { id: editing.room_id, input: toInput(formData) },
                });
                toast.success('Room updated');
            } else {
                await createRoom({ variables: { input: toInput(formData) } });
                toast.success('Room added');
            }
            setEditing(null);
            handleUpdate();
        } catch (err) {
            toast.error(err.graphQLErrors?.[0]?.message || err.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        setDeletingOp(true);
        try {
            const appointments = await roomService.getAppointments(deleting.room_id);
            if (appointments && appointments.length > 0) {
                toast.error(
                    `Cannot delete — Room ${deleting.room_number} has ${appointments.length} appointment(s) assigned.`
                );
                return;
            }
            await deleteRoom({ variables: { id: deleting.room_id } });
            toast.success('Room deleted');
            setDeleting(null);
            handleUpdate();
        } catch (err) {
            toast.error(err.graphQLErrors?.[0]?.message || err.message || 'Failed to delete room');
        } finally {
            setDeletingOp(false);
        }
    }

    return (
        <Layout title="Rooms">
            <div className="space-y-4">
                {!loadingStats && stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Total Rooms"   value={stats.total}       icon="🏥" color="blue"   loading={loadingStats} />
                        <StatCard label="Available"     value={stats.available}   icon="✅" color="green"  loading={loadingStats} />
                        <StatCard label="Occupied"      value={stats.occupied}    icon="🔴" color="red"    loading={loadingStats} />
                        <StatCard label="Maintenance"   value={stats.maintenance} icon="🔧" color="yellow" loading={loadingStats} />
                    </div>
                )}

                <Card
                    title="Room Directory"
                    action={<Button size="sm" onClick={() => setEditing({})}>+ Add Room</Button>}
                >
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : !rooms?.length ? (
                        <p className="text-center py-12 text-gray-400">No rooms registered.</p>
                    ) : (
                        <RoomGrid
                            rooms={rooms}
                            onUpdate={handleUpdate}
                            onEdit={setEditing}
                            onDelete={setDeleting}
                            onViewSchedule={setViewSchedule}
                        />
                    )}
                </Card>
            </div>

            <Modal
                open={Boolean(editing)}
                onClose={() => setEditing(null)}
                title={editing?.room_id ? 'Edit Room' : 'Add Room'}
            >
                {editing && (
                    <RoomForm
                        initial={editing}
                        onSubmit={handleSave}
                        onCancel={() => setEditing(null)}
                        loading={saving}
                    />
                )}
            </Modal>

            <Modal
                open={Boolean(viewSchedule)}
                onClose={() => setViewSchedule(null)}
                title={viewSchedule ? `Room ${viewSchedule.room_number} — Upcoming Schedule` : ''}
                size="lg"
            >
                {viewSchedule && <RoomSchedule roomId={viewSchedule.room_id} />}
            </Modal>

            <ConfirmDialog
                open={Boolean(deleting)}
                onClose={() => setDeleting(null)}
                onConfirm={handleDelete}
                title="Delete Room"
                message={`Delete Room ${deleting?.room_number}? This cannot be undone.`}
                loading={deletingOp}
            />
        </Layout>
    );
}
