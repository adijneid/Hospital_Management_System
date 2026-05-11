export default function Card({ title, action, children, className = '' }) {
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
            {(title || action) && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    {title && <h3 className="text-base font-semibold text-gray-800">{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className="p-6">{children}</div>
        </div>
    );
}
