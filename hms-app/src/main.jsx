import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ApolloProvider } from '@apollo/client/react';
import { Toaster } from 'react-hot-toast';
import { store } from './store/index.js';
import BootstrapGate from './store/BootstrapGate.jsx';
import { apolloClient } from './graphql/client.js';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ErrorBoundary>
            <Provider store={store}>
                <ApolloProvider client={apolloClient}>
                    <BrowserRouter>
                        <BootstrapGate>
                            <App />
                            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
                        </BootstrapGate>
                    </BrowserRouter>
                </ApolloProvider>
            </Provider>
        </ErrorBoundary>
    </StrictMode>
);
