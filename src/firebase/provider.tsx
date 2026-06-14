'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { Analytics, getAnalytics, isSupported } from 'firebase/analytics';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseContextValue {
  app: FirebaseApp | null;
  db: Firestore | null;
  auth: Auth | null;
  analytics: Analytics | null;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  app: null,
  db: null,
  auth: null,
  analytics: null,
});

export function FirebaseProvider({
  children,
  app,
  db,
  auth,
}: {
  children: ReactNode;
  app: FirebaseApp | null;
  db: Firestore | null;
  auth: Auth | null;
}) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    if (app && typeof window !== 'undefined') {
      isSupported().then((supported) => {
        if (supported) {
          try {
            const analyticsInstance = getAnalytics(app);
            setAnalytics(analyticsInstance);
            console.log("Firebase Analytics initialized successfully.");
          } catch (e) {
            console.warn("Analytics initialization failed:", e);
          }
        } else {
          console.warn("Analytics is not supported in this environment.");
        }
      });
    }
  }, [app]);

  return (
    <FirebaseContext.Provider value={{ app, db, auth, analytics }}>
      {children}
      <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
}

export const useFirebaseApp = () => {
  const context = useContext(FirebaseContext);
  return context.app;
};

export const useFirestore = () => {
  const context = useContext(FirebaseContext);
  return context.db;
};

export const useAuth = () => {
  const context = useContext(FirebaseContext);
  return context.auth;
}

export const useAnalyticsInstance = () => {
  const context = useContext(FirebaseContext);
  return context.analytics;
};

export const useFirebase = () => useContext(FirebaseContext);
