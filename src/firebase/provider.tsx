'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseContextValue {
  app: FirebaseApp | null;
  db: Firestore | null;
  auth: Auth | null;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  app: null,
  db: null,
  auth: null,
});

export function FirebaseProvider({
  children,
  app,
  db,
  auth,
}: {
  children: ReactNode;
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
}) {
  return (
    <FirebaseContext.Provider value={{ app, db, auth }}>
      {children}
      <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
}

export const useFirebaseApp = () => {
  const context = useContext(FirebaseContext);
  if (!context.app) throw new Error('useFirebaseApp must be used within FirebaseProvider');
  return context.app;
};

export const useFirestore = () => {
  const context = useContext(FirebaseContext);
  if (!context.db) throw new Error('useFirestore must be used within FirebaseProvider');
  return context.db;
};

export const useAuth = () => {
  const context = useContext(FirebaseContext);
  if (!context.auth) throw new Error('useAuth must be used within FirebaseProvider');
  return context.auth;
}

export const useFirebase = () => useContext(FirebaseContext);
