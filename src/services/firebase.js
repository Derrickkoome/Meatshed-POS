import { initializeApp } from 'firebase/app';
import { initializeFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// force long-polling to avoid QUIC/HTTP3 listen failures
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });

// enable IndexedDB persistence (offline + survive dev reloads where possible)
enableIndexedDbPersistence(db).catch((err) => {
  // failed-precondition: multiple tabs open
  // unimplemented: browser doesn't support persistence (e.g. private mode)
  console.warn('Firestore persistence failed:', err.code || err.message, err);
});

// Initialize Firebase Authentication
export const auth = getAuth(app);

export default app;