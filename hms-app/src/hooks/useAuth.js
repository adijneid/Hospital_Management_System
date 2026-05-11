import { useDispatch, useSelector } from 'react-redux';
import {
    login as loginThunk,
    logout as logoutThunk,
    selectAuthLoading,
    selectUser,
    updateUser as updateUserAction,
} from '../store/slices/authSlice.js';

export function useAuth() {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const loading = useSelector(selectAuthLoading);

    return {
        user,
        loading,
        isAuthenticated: Boolean(user),
        login: (identifier, password) =>
            dispatch(loginThunk({ identifier, password }))
                .unwrap()
                .then((r) => r.user),
        logout: () => dispatch(logoutThunk()),
        updateUser: (updates) => dispatch(updateUserAction(updates)),
    };
}
