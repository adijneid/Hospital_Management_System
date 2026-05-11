import { useEffect } from 'react';
import { getSocket } from './socket.js';

/**
 * Subscribes to a realtime channel and runs `handler(event)` whenever one arrives.
 * `channel` is the socket.io event name (e.g. 'appointment.event', 'doctor.event',
 * 'room.event'). `types` is an optional list of event-type strings to filter on
 * (default: receive all). Wrap the handler in useCallback so it's stable across
 * renders, otherwise the listener is re-attached every render.
 */
export function useEntityEvents(channel, handler, types) {
    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        const filter = types && types.length ? new Set(types) : null;
        const onEvent = (event) => {
            if (filter && !filter.has(event.type)) return;
            handler(event);
        };

        socket.on(channel, onEvent);
        return () => socket.off(channel, onEvent);
    }, [channel, handler, types?.join(',')]);
}

// Convenience wrappers — the channels the backend currently emits.
export const useAppointmentEvents = (handler, types) =>
    useEntityEvents('appointment.event', handler, types);

export const useDoctorEvents = (handler, types) =>
    useEntityEvents('doctor.event', handler, types);

export const useRoomEvents = (handler, types) =>
    useEntityEvents('room.event', handler, types);
