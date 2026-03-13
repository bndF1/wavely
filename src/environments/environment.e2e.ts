// E2E-only environment — connects to Firebase Auth + Firestore emulators.
// Uses fake Firebase config (emulators accept any API key).
// Never deployed to production.
export const environment = {
  production: false,
  useEmulators: true,
  sentryDsn: '',
  firebase: {
    apiKey: 'fake-api-key',
    authDomain: 'wavely-f659c.firebaseapp.com',
    projectId: 'wavely-f659c',
    storageBucket: 'wavely-f659c.appspot.com',
    messagingSenderId: '000000000000',
    appId: '1:000000000000:web:000000000000000000000000',
    measurementId: '',
  },
};
