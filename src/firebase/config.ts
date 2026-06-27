'use client';

/**
 * @fileOverview Hardened Firebase configuration.
 * Fetches credentials from environment variables for secure multi-node deployment.
 */

const getEnv = (key: string) => {
  if (typeof process === 'undefined' || !process.env) return '';
  const val = process.env[key];
  return val || '';
};

export const firebaseConfig = {
  apiKey: getEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
  measurementId: getEnv('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID')
};
