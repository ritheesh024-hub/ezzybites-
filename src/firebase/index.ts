'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * IDEMPOTENT FIREBASE INITIALIZATION (HARDENED SINGLETON)
 * Uses a global registry to survive Next.js module re-evaluations during HMR.
 */

interface FirebaseInstances {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
}

export function initializeFirebase(): { 
  app: FirebaseApp | null; 
  db: Firestore | null; 
  auth: Auth | null;
} {
  if (typeof window === 'undefined') {
    return { app: null, db: null, auth: null };
  }

  try {
    const g = globalThis as any;
    
    // Check global cache first to prevent "Unexpected state" errors during HMR
    if (g.__FIREBASE_SINGLETON__) {
      return g.__FIREBASE_SINGLETON__;
    }

    // 1. Initialize or retrieve the App Registry
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

    // 2. Retrieve Services
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    const instances: FirebaseInstances = { app, db, auth };
    
    // 3. Cache globally
    g.__FIREBASE_SINGLETON__ = instances;
    
    return instances;
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
