'use client';

import { useState, useEffect, useRef } from 'react';
import { onSnapshot, DocumentReference, DocumentData } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '../errors';

/**
 * STABILIZED DOCUMENT HOOK
 * Resolves "ca9" errors by adding a 100ms settle-delay. This ensures 
 * that the internal Firestore state machine isn't overloaded during HMR.
 */
export function useDoc<T = DocumentData>(docRef: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastPathRef = useRef<string | null>(null);
  const docPath = docRef?.path || null;

  useEffect(() => {
    // Identity Check
    if (docPath === lastPathRef.current && docPath !== null) {
      return;
    }
    lastPathRef.current = docPath;

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

    // SETTLE-DELAY: Prevents rapid-fire subscription crashes
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
        console.error("Firestore Doc Listener Failed:", err);
        setError(err);
        setLoading(false);
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [docPath]); 

  return { data, loading, error };
}
