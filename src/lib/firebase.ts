import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAnalytics, isSupported, logEvent as fbLogEvent, Analytics } from 'firebase/analytics';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Guard: only initialize Firebase if env vars are present (not at build time)
const hasValidConfig = !!firebaseConfig.projectId && !!firebaseConfig.databaseURL;

const app = hasValidConfig
  ? (!getApps().length ? initializeApp(firebaseConfig) : getApp())
  : null;

// ─── Google Firebase Services ──────────────────────────────────────────────

/** Firebase Realtime Database — sub-100ms crowd location sync */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = hasValidConfig && app ? getDatabase(app) : null as any;

/** Firebase Authentication — anonymous sign-in for persistent user identity */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth = hasValidConfig && app ? getAuth(app) : null as any;

/** Firebase Storage — stores room assets and user data */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const storage = hasValidConfig && app ? getStorage(app) : null as any;

// ─── Firebase Anonymous Authentication ────────────────────────────────────

/**
 * Sign in anonymously using Firebase Authentication.
 * Returns a persistent Firebase User with a stable UID across sessions.
 * This is the foundation of our identity system — no account needed.
 */
export async function signInAnonymousUser(): Promise<User | null> {
  if (!auth) return null;
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.warn('Firebase anonymous auth failed, using local ID:', error);
    return null;
  }
}

/**
 * Subscribe to authentication state changes.
 * Fires immediately with current user (or null if not signed in).
 */
export function onAuthChange(callback: (user: User | null) => void) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}

// ─── Firebase Analytics ────────────────────────────────────────────────────

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

/**
 * Log a named event to Firebase Analytics (Google Analytics 4).
 * Used to track: room_created, pin_dropped, sos_activated, gemini_queried, egress_launched.
 */
export async function logEvent(eventName: string, params?: Record<string, string | number>) {
  try {
    const analytics = await getAnalyticsInstance();
    if (analytics) fbLogEvent(analytics, eventName, params);
  } catch {
    // Analytics should never block user flow
  }
}
