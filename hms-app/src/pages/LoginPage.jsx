import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Input, FormField } from '../components/common/FormField.jsx';
import Button from '../components/common/Button.jsx';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword]     = useState('');
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState(null);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!identifier.trim() || !password) {
            setError('Please enter your username/email and password.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const user = await login(identifier.trim(), password);
            toast.success(`Welcome, ${user.fullName || user.username}!`);
            navigate(user.role === 'doctor' ? '/doctor/dashboard' : '/dashboard', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🏥</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">HMS</h1>
                    <p className="text-gray-500 text-sm mt-1">Hospital Management System</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField label="Username or Email">
                        <Input
                            value={identifier}
                            onChange={e => setIdentifier(e.target.value)}
                            placeholder="sarah.jenkins"
                            autoFocus
                        />
                    </FormField>

                    <FormField label="Password">
                        <Input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </FormField>

                    <Button type="submit" className="w-full" size="lg" loading={loading}>
                        Sign In
                    </Button>
                </form>

                <div className="mt-6 p-4 bg-gray-50 rounded-xl text-xs text-gray-500 space-y-1">
                    <p className="font-semibold text-gray-600 mb-2">Demo credentials (password: password123)</p>
                    <p>Staff: <code className="bg-white px-1 rounded">sarah.jenkins</code> or <code className="bg-white px-1 rounded">michael.reed</code></p>
                    <p>Doctor: <code className="bg-white px-1 rounded">dr.hassan</code>, <code className="bg-white px-1 rounded">dr.saab</code>, <code className="bg-white px-1 rounded">dr.khoury</code></p>
                </div>
            </div>
        </div>
    );
}
