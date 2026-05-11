export function FormField({ label, error, required, children }) {
    return (
        <div className="flex flex-col gap-1">
            {label && (
                <label className="text-sm font-medium text-gray-700">
                    {label}{required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            {children}
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}

const base = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400';

export function Input({ className = '', ...props }) {
    return <input className={`${base} ${className}`} {...props} />;
}

export function Select({ className = '', children, ...props }) {
    return (
        <select className={`${base} ${className}`} {...props}>
            {children}
        </select>
    );
}

export function Textarea({ className = '', rows = 3, ...props }) {
    return <textarea rows={rows} className={`${base} resize-none ${className}`} {...props} />;
}
