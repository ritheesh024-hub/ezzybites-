'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, DocumentReference, DocumentData } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '../errors';

/**
 * HIGH-INTEGRITY DOCUMENT HOOK v3.0
 * Uses an active-mount guard to prevent Firestore internal state machine collisions.
 */
export function useDoc<T = DocumentData>(docRef: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
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
          if (!isMounted) return;
          setData(snapshot.data() || null);
          setLoading(false);
          setError(null);
        },
        (serverError: any) => {
          if (!isMounted) return;
          
          console.error("🔥 [Ezzy Flux] Doc Sync Error:", {
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
      if (isMounted) {
        setError(err);
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [docRef?.path]); // Depend strictly on the path identity

  return { data, loading, error };
}
