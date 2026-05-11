import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import Modal from './Modal.jsx';
import ProfileEditor from './ProfileEditor.jsx';

const staffLinks = [
    { to: '/dashboard',    label: 'Dashboard',    icon: '📊' },
    { to: '/patients',     label: 'Patients',     icon: '👤' },
    { to: '/appointments', label: 'Appointments', icon: '📅' },
    { to: '/doctors',      label: 'Doctors',      icon: '🩺' },
    { to: '/rooms',        label: 'Rooms',        icon: '🏥' },
];

const doctorLinks = [
    { to: '/doctor/dashboard',     label: 'My Schedule',     icon: '📅' },
    { to: '/doctor/patients',      label: 'My Patients',     icon: '👤' },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const links = user?.role === 'doctor' ? doctorLinks : staffLinks;

    return (
        <>
            <aside className={`${collapsed ? 'w-16' : 'w-64'} h-screen bg-gray-900 flex flex-col sticky top-0 transition-all duration-300`}>
                {/* Header */}
                <div className="px-3 py-4 border-b border-gray-700 flex items-center justify-between">
                    {!collapsed && (
                        <div className="px-2">
                            <h1 className="text-white font-bold text-lg">HMS</h1>
                            <p className="text-gray-400 text-xs">Hospital Management</p>
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(c => !c)}
                        className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors mx-auto"
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <svg className={`w-5 h-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </button>
                </div>

                {/* Nav links */}
                <nav className="flex-1 px-2 py-4 space-y-1">
                    {links.map(link => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            title={collapsed ? link.label : undefined}
                            className={({ isActive }) =>
                                `flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                                    isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                }`
                            }
                        >
                            <span className="text-lg">{link.icon}</span>
                            {!collapsed && <span>{link.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* User + Sign out */}
                <div className="px-2 py-3 border-t border-gray-700">
                    {!collapsed ? (
                        <div className="flex items-center justify-between gap-2 px-2 py-2">
                            <button
                                onClick={() => setShowProfile(true)}
                                className="min-w-0 text-left hover:bg-gray-800 rounded-lg px-2 py-1 -mx-2 transition-colors"
                                title="Edit profile"
                            >
                                <p className="text-white text-sm font-medium truncate">{user?.fullName || user?.username}</p>
                                <p className="text-gray-400 text-xs capitalize">{user?.role}</p>
                            </button>
                            <button
                                onClick={logout}
                                title="Sign out"
                                className="text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-gray-800 transition-colors flex-shrink-0"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 py-1">
                            <button
                                onClick={() => setShowProfile(true)}
                                title="Edit profile"
                                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </button>
                            <button
                                onClick={logout}
                                title="Sign out"
                                className="text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            <Modal
                open={showProfile}
                onClose={() => setShowProfile(false)}
                title="Edit Profile"
            >
                <ProfileEditor onClose={() => setShowProfile(false)} />
            </Modal>
        </>
    );
}
