import { Component } from 'react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        // eslint-disable-next-line no-console
        console.error('ErrorBoundary caught:', error, info);
    }

    handleReload = () => {
        this.setState({ error: null });
        window.location.reload();
    };

    render() {
        if (!this.state.error) return this.props.children;

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center space-y-4">
                    <div className="text-5xl">⚠️</div>
                    <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>
                    <p className="text-sm text-gray-500">
                        The page hit an unexpected error. Try reloading — if it keeps happening,
                        sign out and back in.
                    </p>
                    <details className="text-left text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                        <summary className="cursor-pointer">Technical details</summary>
                        <pre className="mt-2 whitespace-pre-wrap break-words">
                            {this.state.error?.message || String(this.state.error)}
                        </pre>
                    </details>
                    <button
                        onClick={this.handleReload}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                    >
                        Reload
                    </button>
                </div>
            </div>
        );
    }
}
