'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * HARDENED FIREBASE SINGLETON v3.0
 * Prevents "Unexpected State" assertions by using a global window registry 
 * and strict browser-only initialization.
 */

interface FirebaseInstances {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
}

declare global {
  interface Window {
    __FIREBASE_STATION_REGISTRY__?: FirebaseInstances;
  }
}

export function initializeFirebase(): { 
  app: FirebaseApp | null; 
  db: Firestore | null; 
  auth: Auth | null;
} {
  // 1. Strict browser-only guard
  if (typeof window === 'undefined') {
    return { app: null, db: null, auth: null };
  }

  try {
    // 2. Return cached instances if they exist (Survivability Node)
    if (window.__FIREBASE_STATION_REGISTRY__) {
      return window.__FIREBASE_STATION_REGISTRY__;
    }

    // 3. Initialize or retrieve existing app
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
    
    // 4. Initialize services with current app context
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    const instances: FirebaseInstances = { app, db, auth };
    
    // 5. Cache globally to prevent SDK re-init collisions during HMR
    window.__FIREBASE_STATION_REGISTRY__ = instances;
    
    return instances;
  } catch (error) {
    console.error('🔥 [Ezzy Ops] Firebase Registry Fail:', error);
    return { app: null, db: null, auth: null };
  }
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-doc';
export * from './firestore/use-collection';
export * from './error-emitter';
export * from './errors';
