import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { bootstrap } from './slices/authSlice.js';

export default function BootstrapGate({ children }) {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(bootstrap());
    }, [dispatch]);
    return children;
}
