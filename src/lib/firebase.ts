import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Only initialize Firebase if we have a valid config (not at build time)
const hasValidConfig = !!firebaseConfig.projectId && !!firebaseConfig.databaseURL;

const app = hasValidConfig
  ? (!getApps().length ? initializeApp(firebaseConfig) : getApp())
  : null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = hasValidConfig && app ? getDatabase(app) : null as any;
