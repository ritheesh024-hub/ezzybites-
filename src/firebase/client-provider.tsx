'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<{
    app: FirebaseApp;
    db: Firestore;
    auth: Auth;
  } | null>(null);

  useEffect(() => {
    const initialized = initializeFirebase();
    setServices(initialized);
  }, []);

  if (!services) {
    return null; // Or a loading spinner
  }

  return (
    <FirebaseProvider app={services.app} db={services.db} auth={services.auth}>
      {children}
    </FirebaseProvider>
  );
}
