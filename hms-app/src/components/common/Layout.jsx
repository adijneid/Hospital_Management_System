import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';

export default function Layout({ title, children }) {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Navbar title={title} />
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
