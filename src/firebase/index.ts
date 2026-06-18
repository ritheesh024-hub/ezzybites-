import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getMessaging, Messaging, isSupported as isMessagingSupported } from 'firebase/messaging';
import { firebaseConfig } from './config';

/**
 * Initializes Firebase services safely.
 * Note: Analytics is initialized asynchronously in the provider.
 */
export function initializeFirebase(): { 
  app: FirebaseApp | null; 
  db: Firestore | null; 
  auth: Auth | null;
  messaging: Messaging | null;
} {
  // Check if config has been updated from defaults
  const isConfigValid = 
    firebaseConfig.apiKey && 
    !firebaseConfig.apiKey.includes('your_');

  if (!isConfigValid) {
    console.warn('Firebase configuration is missing or incomplete.');
    return { app: null, db: null, auth: null, messaging: null };
  }

  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    // Messaging is client-only and environment dependent
    let messaging: Messaging | null = null;
    if (typeof window !== 'undefined') {
      isMessagingSupported().then(supported => {
        if (supported) messaging = getMessaging(app);
      });
    }
    
    return { app, db, auth, messaging };
  } catch (error) {
    console.error('Failed to initialize Firebase services:', error);
    return { app: null, db: null, auth: null, messaging: null };
  }
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-doc';
export * from './firestore/use-collection';
export * from './error-emitter';
export * from './errors';
