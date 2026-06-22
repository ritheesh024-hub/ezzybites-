'use client';

import { useState, useEffect, useRef } from 'react';
import { onSnapshot, Query, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '../errors';

/**
 * STABILIZED COLLECTION HOOK v2.0
 * Uses a unique query path key to prevent redundant re-subscriptions 
 * which trigger the "ca9" internal assertion.
 */
export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const activeKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // 1. Path-Identity Check: Is this the same logic node?
    // We attempt to extract a stable key from the internal _query or string representation
    let currentKey = 'null';
    try {
      if (query) {
        currentKey = (query as any)._query?.path?.toString() || JSON.stringify((query as any)._query) || 'active';
      }
    } catch (e) {
      currentKey = 'error-key';
    }

    if (currentKey === activeKeyRef.current && currentKey !== 'null') {
      return; 
    }
    
    // 2. Identity Rotation
    activeKeyRef.current = currentKey;

    // 3. Cleanup previous node
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (!query || typeof window === 'undefined') {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // 4. SETTLE-DELAY: Critical for Next.js HMR stability
    const timeoutId = setTimeout(() => {
      try {
        const unsubscribe = onSnapshot(
          query,
          (snapshot: QuerySnapshot<T>) => {
            const items = snapshot.docs.map((doc) => ({
              ...doc.data(),
              id: doc.id,
            })) as T[];
            setData(items);
            setLoading(false);
            setError(null);
          },
          async (serverError: any) => {
            if (serverError.code === 'permission-denied') {
              const permissionError = new FirestorePermissionError({
                path: 'collection_stream',
                operation: 'list',
              } satisfies SecurityRuleContext);

              errorEmitter.emit('permission-error', permissionError);
            }
            
            setError(serverError);
            setLoading(false);
          }
        );

        unsubscribeRef.current = unsubscribe;
      } catch (err: any) {
        console.warn("⚠️ Firestore Flow Interrupted:", err.message);
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
  }, [query]); 

  return { data, loading, error };
}
