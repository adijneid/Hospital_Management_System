import { useState } from 'react';
import { roomTypeIcon } from '../../utils/formatters.js';
import { roomService } from '../../services/roomService.js';
import toast from 'react-hot-toast';

export default function RoomCard({ room, onUpdate, onEdit, onDelete, onViewSchedule }) {
    const [changing, setChanging] = useState(false);

    async function toggleMaintenance() {
        const newStatus = room.status === 'maintenance' ? 'available' : 'maintenance';
        setChanging(true);
        try {
            await roomService.updateStatus(room.room_id, newStatus);
            onUpdate();
            toast.success(`Room ${room.room_number} → ${newStatus}`);
        } catch {
            toast.error('Failed to update room status');
        } finally {
            setChanging(false);
        }
    }

    return (
        <div className={`bg-white rounded-xl p-4 border shadow-sm flex flex-col gap-3 ${
            room.status === 'maintenance' ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
        }`}>
            <div className="flex items-center gap-2">
                <span className="text-xl">{roomTypeIcon(room.room_type)}</span>
                <div className="min-w-0">
                    <p className="font-bold text-gray-900">Room {room.room_number}</p>
                    <p className="text-xs text-gray-400 capitalize truncate">{room.room_type} • Floor {room.floor} • Cap {room.capacity}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => onViewSchedule(room)}
                    className="text-xs px-2 py-1.5 rounded-lg font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                >
                    Schedule
                </button>
                <button
                    onClick={toggleMaintenance}
                    disabled={changing}
                    className={`text-xs px-2 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                        room.status === 'maintenance'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    }`}
                >
                    {room.status === 'maintenance' ? 'End Maint.' : 'Maintenance'}
                </button>
            </div>

            <div className="flex justify-end gap-1 border-t border-gray-100 pt-2">
                <button onClick={() => onEdit(room)} className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100" title="Edit">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </button>
                <button onClick={() => onDelete(room)} className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100" title="Delete">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
