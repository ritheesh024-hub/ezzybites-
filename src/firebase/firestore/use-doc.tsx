'use client';

import { useState, useEffect, useRef } from 'react';
import { onSnapshot, DocumentReference, DocumentData } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '../errors';

/**
 * ATOMIC DOCUMENT HOOK v5.0
 * Prevents overlapping subscriptions and ensures state resolution on network failure.
 */
export function useDoc<T = DocumentData>(docRef: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    let unsubscribe: (() => void) | null = null;

    if (!docRef) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (!isMounted.current) return;
          setData(snapshot.data() || null);
          setError(null);
          setLoading(false);
        },
        (serverError: any) => {
          if (!isMounted.current) return;
          
          console.warn("⚠️ [Ezzy Flux] Firestore Doc Sync Error:", {
            code: serverError.code,
            path: docRef.path
          });

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
    } catch (err: any) {
      if (isMounted.current) {
        setError(err);
        setLoading(false);
      }
    }

    return () => {
      isMounted.current = false;
      if (unsubscribe) unsubscribe();
    };
  }, [docRef?.path]); 

  return { data, loading, error };
}
