
'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * HARDENED FIREBASE SINGLETON v6.1
 * Includes Offline Persistence Registry and API Key Integrity Guard.
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
    if (window.__EZZY_FIREBASE_STATION__) {
      return window.__EZZY_FIREBASE_STATION__;
    }

    // Integrity Check: Ensure API key is present before initialization
    if (!firebaseConfig.apiKey) {
      console.error('🔥 [Ezzy Ops] Firebase Handshake Aborted: Missing API Key in configuration.');
      return { app: null, db: null, auth: null };
    }

    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    // Enable Offline Persistence for a seamless PWA experience
    enableMultiTabIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('⚠️ [Ezzy PWA] Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('⚠️ [Ezzy PWA] Browser does not support persistence.');
      }
    });

    const instances = { app, db, auth };
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
