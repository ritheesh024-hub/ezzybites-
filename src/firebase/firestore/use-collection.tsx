'use client';

import { useState, useEffect, useRef } from 'react';
import { onSnapshot, Query, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '../errors';

/**
 * STABILIZED COLLECTION HOOK
 * Resolves "ca9" errors by adding a 100ms settle-delay. This prevents
 * race conditions during rapid Next.js HMR cycles.
 */
export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastQueryRef = useRef<string | null>(null);

  useEffect(() => {
    // 1. Identity Check: Avoid redundant re-subscriptions if the query hasn't changed.
    // This is critical for preventing internal state corruption during re-renders.
    const queryKey = query ? JSON.stringify((query as any)._query || query.toString()) : null;
    if (queryKey === lastQueryRef.current && queryKey !== null) {
      return; 
    }
    lastQueryRef.current = queryKey;

    // 2. Cleanup previous listener
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

    // 3. SETTLE-DELAY: Gives the Firestore SyncEngine time to settle during HMR
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
              let path = 'collection';
              try {
                const internalQuery = (query as any)._query;
                if (internalQuery && internalQuery.path) {
                  path = internalQuery.path.toArray().join('/');
                }
              } catch (e) {}

              const permissionError = new FirestorePermissionError({
                path: path,
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
        console.error("Firestore Listener Setup Failed:", err);
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
  }, [query]); 

  return { data, loading, error };
}
