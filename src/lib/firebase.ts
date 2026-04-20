import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAnalytics, isSupported, logEvent as fbLogEvent, Analytics } from 'firebase/analytics';

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

// Firebase Analytics — only works in browser, not SSR
let analyticsInstance: Analytics | null = null;
export async function getAnalyticsInstance(): Promise<Analytics | null> {
  if (!app || !hasValidConfig) return null;
  if (analyticsInstance) return analyticsInstance;
  const supported = await isSupported();
  if (supported) {
    analyticsInstance = getAnalytics(app);
    return analyticsInstance;
  }
  return null;
}

/** Log a named event to Firebase Analytics */
export async function logEvent(eventName: string, params?: Record<string, string | number>) {
  try {
    const analytics = await getAnalyticsInstance();
    if (analytics) fbLogEvent(analytics, eventName, params);
  } catch {
    // Silently fail — analytics should never break user flow
  }
}
