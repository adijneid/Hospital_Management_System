import { ApolloClient, HttpLink, InMemoryCache, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { store } from '../store/index.js';
import { logout } from '../store/slices/authSlice.js';

const httpLink = new HttpLink({ uri: '/graphql' });

const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem('hms_token');
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : '',
        },
    };
});

const errorLink = onError(({ graphQLErrors }) => {
    if (graphQLErrors?.some((e) => e.extensions?.code === 'UNAUTHENTICATED')) {
        store.dispatch(logout());
        window.location.href = '/login';
    }
});

// Our GraphQL types use snake_case primary keys (patient_id, doctor_id, …),
// not Apollo's default `id`. Without these typePolicies the cache normalizer
// can't dedupe rows across queries, so list refetches may show stale data.
const cache = new InMemoryCache({
    typePolicies: {
        Patient:     { keyFields: ['patient_id'] },
        Doctor:      { keyFields: ['doctor_id'] },
        Room:        { keyFields: ['room_id'] },
        Appointment: { keyFields: ['appointment_id'] },
    },
});

export const apolloClient = new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache,
});
