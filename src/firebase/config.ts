
'use client';

/**
 * @fileOverview Hardened Firebase configuration.
 * Explicitly maps environment variables for high-integrity client-side bundling.
 * Next.js requires explicit process.env references to inline values during build.
 */

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ''
};

// Diagnostic Node: Log warning if keys are missing in the browser environment
if (typeof window !== 'undefined' && !firebaseConfig.apiKey) {
  console.warn('⚠️ [Ezzy Ops] Firebase Handshake Pending: NEXT_PUBLIC_FIREBASE_API_KEY is not detected.');
}
