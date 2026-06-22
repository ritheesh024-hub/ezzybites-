'use client';

import { useState, useEffect, useRef } from 'react';
import { onSnapshot, Query, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '../errors';

/**
 * ATOMIC COLLECTION HOOK v5.0
 * Guaranteed to resolve loading state and handle Firestore exceptions without breaking UI.
 */
export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  
  // Guard against updates on unmounted components
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    let unsubscribe: (() => void) | null = null;

    if (!query) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      unsubscribe = onSnapshot(
        query,
        (snapshot: QuerySnapshot<T>) => {
          if (!isMounted.current) return;
          const items = snapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          })) as T[];
          setData(items);
          setError(null);
          setLoading(false);
        },
        (serverError: any) => {
          if (!isMounted.current) return;
          
          // Identify the path for descriptive logging
          const path = (query as any)._query?.path?.segments?.join('/') || 'collection';
          
          console.warn("⚠️ [Ezzy Flux] Firestore Query Restricted:", {
            code: serverError.code,
            path: path,
            message: serverError.message
          });
          
          if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
              path: path,
              operation: 'list',
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
          }
          
          setError(serverError);
          setLoading(false); // CRITICAL: Resolve loading state to prevent infinite skeletons
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
  }, [query]); 

  return { data, loading, error };
}
