import RoomCard from './RoomCard.jsx';

export default function RoomGrid({ rooms, onUpdate, onEdit, onDelete, onViewSchedule }) {
    const byFloor = rooms.reduce((acc, room) => {
        const floor = room.floor ?? 0;
        if (!acc[floor]) acc[floor] = [];
        acc[floor].push(room);
        return acc;
    }, {});

    const floors = Object.keys(byFloor).sort((a, b) => Number(a) - Number(b));

    return (
        <div className="space-y-6">
            {floors.map(floor => (
                <div key={floor}>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        {floor === '0' ? 'Ground Floor' : `Floor ${floor}`}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {byFloor[floor].map(room => (
                            <RoomCard
                                key={room.room_id}
                                room={room}
                                onUpdate={onUpdate}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onViewSchedule={onViewSchedule}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
