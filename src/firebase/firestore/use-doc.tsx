'use client';

import { useState, useEffect, useRef } from 'react';
import { onSnapshot, DocumentReference, DocumentData } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '../errors';

/**
 * STABILIZED DOCUMENT HOOK v2.0
 * Prevents rapid-fire re-subscription crashes by tracking the document path identity.
 */
export function useDoc<T = DocumentData>(docRef: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastPathRef = useRef<string | null>(null);
  const currentPath = docRef?.path || null;

  useEffect(() => {
    // 1. Identity Check
    if (currentPath === lastPathRef.current && currentPath !== null) {
      return;
    }
    lastPathRef.current = currentPath;

    // 2. Node Cleanup
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (!docRef || typeof window === 'undefined') {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    // 3. SETTLE-DELAY: Synchronizes with the Firestore SyncEngine state
    const timeoutId = setTimeout(() => {
      try {
        const unsubscribe = onSnapshot(
          docRef,
          (snapshot) => {
            setData(snapshot.data() || null);
            setLoading(false);
            setError(null);
          },
          async (serverError: any) => {
            if (serverError.code === 'permission-denied') {
              const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'get',
              } satisfies SecurityRuleContext);

              errorEmitter.emit('permission-error', permissionError);
            }
            
            setError(serverError);
            setLoading(false);
          }
        );

        unsubscribeRef.current = unsubscribe;
      } catch (err: any) {
        console.warn("⚠️ Document Signal Interrupted:", err.message);
        setError(err);
        setLoading(false);
      }
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [currentPath]); 

  return { data, loading, error };
}
