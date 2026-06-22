'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * HARDENED FIREBASE SINGLETON
 * Prevents "ca9" Unexpected State errors by ensuring exactly one instance 
 * of each service exists globally, surviving Next.js HMR.
 */

interface FirebaseInstances {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
}

declare global {
  interface Window {
    __FIREBASE_SINGLETON_INSTANCE__?: FirebaseInstances;
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
    // 1. Return cached instances if they exist on the window
    // This is more reliable than module-level variables during Next.js HMR
    if (window.__FIREBASE_SINGLETON_INSTANCE__) {
      return window.__FIREBASE_SINGLETON_INSTANCE__;
    }

    // 2. Initialize or retrieve existing app
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
    
    // 3. Initialize services
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    const instances: FirebaseInstances = { app, db, auth };
    
    // 4. Cache globally
    window.__FIREBASE_SINGLETON_INSTANCE__ = instances;
    
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
