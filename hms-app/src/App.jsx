import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';

// Pages
import LoginPage from './pages/LoginPage.jsx';
import StaffDashboard from './pages/StaffDashboard.jsx';
import DoctorDashboard from './pages/DoctorDashboard.jsx';
import PatientsPage from './pages/PatientsPage.jsx';
import AppointmentsPage from './pages/AppointmentsPage.jsx';
import DoctorsPage from './pages/DoctorsPage.jsx';
import RoomsPage from './pages/RoomsPage.jsx';
import DoctorPatientsPage from './pages/DoctorPatientsPage.jsx';

function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    // Only stay blank while we're actively validating a stored token. With no
    // stored token, the answer is decided — bounce straight to the login page
    // (mounted at "/") instead of showing a loading spinner.
    const hasStoredToken =
        typeof window !== 'undefined' && !!localStorage.getItem('hms_token');
    if (loading && hasStoredToken) return null;
    if (!isAuthenticated) return <Navigate to="/" replace />;
    return children;
}

function StaffRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/" replace />;
    if (user.role !== 'staff') return <Navigate to="/doctor/dashboard" replace />;
    return children;
}

function DoctorRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/" replace />;
    if (user.role !== 'doctor') return <Navigate to="/dashboard" replace />;
    return children;
}

function RootEntry() {
    const { user, loading } = useAuth();

    // Authenticated → bounce to the role-specific dashboard
    if (user) {
        return user.role === 'doctor'
            ? <Navigate to="/doctor/dashboard" replace />
            : <Navigate to="/dashboard" replace />;
    }

    // Still validating a stored token — render nothing briefly to avoid a
    // login-then-dashboard flash. With no stored token at all, fall through
    // and render LoginPage immediately.
    const hasStoredToken =
        typeof window !== 'undefined' && !!localStorage.getItem('hms_token');
    if (loading && hasStoredToken) return null;

    return <LoginPage />;
}

export default function App() {
    return (
        <Routes>
            {/* Opening page is the login screen. /login kept as an alias for
                direct links / interceptor redirects. Both render the same logic. */}
            <Route path="/" element={<RootEntry />} />
            <Route path="/login" element={<RootEntry />} />

            <Route path="/dashboard" element={
                <ProtectedRoute><StaffRoute><StaffDashboard /></StaffRoute></ProtectedRoute>
            } />

            <Route path="/patients" element={
                <ProtectedRoute><StaffRoute><PatientsPage /></StaffRoute></ProtectedRoute>
            } />

            <Route path="/appointments" element={
                <ProtectedRoute><StaffRoute><AppointmentsPage /></StaffRoute></ProtectedRoute>
            } />

            <Route path="/doctors" element={
                <ProtectedRoute><StaffRoute><DoctorsPage /></StaffRoute></ProtectedRoute>
            } />

            <Route path="/rooms" element={
                <ProtectedRoute><StaffRoute><RoomsPage /></StaffRoute></ProtectedRoute>
            } />

            <Route path="/doctor/dashboard" element={
                <ProtectedRoute><DoctorRoute><DoctorDashboard /></DoctorRoute></ProtectedRoute>
            } />

            <Route path="/doctor/patients" element={
                <ProtectedRoute><DoctorRoute><DoctorPatientsPage /></DoctorRoute></ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
