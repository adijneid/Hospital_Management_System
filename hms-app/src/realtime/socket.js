import { io } from 'socket.io-client';

let socket = null;

/**
 * Returns a lazily-created singleton socket connected to the backend.
 * Reads `hms_token` from localStorage and passes it in the handshake auth.
 * Safe to call multiple times — returns the existing instance.
 */
export function getSocket() {
    if (socket) return socket;

    const token = localStorage.getItem('hms_token');
    if (!token) return null;

    socket = io({
        // Vite proxies /socket.io to backend (see vite.config.js).
        // Default `path` is /socket.io which is what Nest exposes.
        auth: { token },
        autoConnect: true,
        reconnection: true,
    });

    if (import.meta.env.DEV) {
        socket.on('connect', () => console.log('[ws] connected', socket.id));
        socket.on('disconnect', (r) => console.log('[ws] disconnected', r));
        socket.on('connect_error', (e) => console.warn('[ws] connect_error', e.message));
    }

    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
