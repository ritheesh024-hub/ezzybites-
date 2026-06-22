'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * HARDENED FIREBASE SINGLETON v5.0
 * Uses a global registry to survive HMR and prevent "Unexpected state (ID: ca9)" errors.
 * This is the critical stabilization node for Next.js development.
 */

interface FirebaseInstances {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
}

declare global {
  interface Window {
    __EZZY_FIREBASE_STATION__?: FirebaseInstances;
  }
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
    // 1. Check for existing stable node in window registry
    if (window.__EZZY_FIREBASE_STATION__) {
      return window.__EZZY_FIREBASE_STATION__;
    }

    // 2. Initialize exactly once per browser session
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    const instances = { app, db, auth };
    
    // 3. Persist to window to neutralize HMR race conditions
    window.__EZZY_FIREBASE_STATION__ = instances;
    
    return instances;
  } catch (error) {
    console.error('🔥 [Ezzy Ops] Firebase Handshake Failed:', error);
    return { app: null, db: null, auth: null };
  }
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-doc';
export * from './firestore/use-collection';
export * from './error-emitter';
export * from './errors';
