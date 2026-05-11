import { useState, useEffect } from 'react';
import Avatar from './Avatar.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export default function Navbar({ title }) {
    const { user } = useAuth();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 60000);
        return () => clearInterval(t);
    }, []);

    const timeStr = time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const dateStr = time.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-700">{timeStr}</p>
                    <p className="text-xs text-gray-400">{dateStr}</p>
                </div>
                <Avatar name={user?.fullName || user?.username} size="sm" />
            </div>
        </header>
    );
}
