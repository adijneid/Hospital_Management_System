import { getInitials } from '../../utils/formatters.js';

const palette = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500',
    'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
];

function colorFor(name) {
    if (!name) return palette[0];
    let hash = 0;
    for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
}

export default function Avatar({ name, size = 'md' }) {
    const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
    return (
        <div className={`${sizes[size]} ${colorFor(name)} rounded-full flex items-center justify-center text-white font-semibold select-none`}>
            {getInitials(name)}
        </div>
    );
}
