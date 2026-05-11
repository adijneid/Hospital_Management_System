export default function StatCard({ label, value, icon, color = 'blue', loading = false }) {
    const colors = {
        blue:   'bg-blue-50 text-blue-600',
        green:  'bg-green-50 text-green-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        red:    'bg-red-50 text-red-600',
        purple: 'bg-purple-50 text-purple-600',
    };
    return (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${colors[color] || colors.blue}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                {loading
                    ? <div className="h-7 w-16 bg-gray-100 rounded animate-pulse mt-1" />
                    : <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
                }
            </div>
        </div>
    );
}
