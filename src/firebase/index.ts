'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * IDEMPOTENT FIREBASE INITIALIZATION
 * Uses the getApps() registry to ensure singleton behavior 
 * across Next.js reloads and hydration.
 */

export function initializeFirebase(): { 
  app: FirebaseApp | null; 
  db: Firestore | null; 
  auth: Auth | null;
} {
  if (typeof window === 'undefined') {
    return { app: null, db: null, auth: null };
  }

  try {
    // 1. Initialize or retrieve the App Registry
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

    // 2. Retrieve Firestore instance (Firebase handles singleton behavior internally)
    const db = getFirestore(app);

    // 3. Retrieve Auth instance
    const auth = getAuth(app);
    
    return { app, db, auth };
  } catch (error) {
    console.error('Firebase Critical Init Error:', error);
    return { app: null, db: null, auth: null };
  }
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-doc';
export * from './firestore/use-collection';
export * from './error-emitter';
export * from './errors';
