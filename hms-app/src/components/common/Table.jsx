export default function Table({ columns, data, loading, emptyMessage = 'No records found.' }) {
    if (loading) {
        return (
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                ))}
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 17v-2m3 2v-4m3 4v-6M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <p>{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
                <thead>
                    <tr>
                        {columns.map(col => (
                            <th key={col.key}
                                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {data.map((row, i) => (
                        <tr key={row.id || i} className="hover:bg-gray-50 transition-colors">
                            {columns.map(col => (
                                <td key={col.key} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                    {col.render ? col.render(row) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
