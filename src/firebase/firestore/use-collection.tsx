'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, Query, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '../errors';

/**
 * HIGH-INTEGRITY COLLECTION HOOK v3.0
 * Guarantees state resolution and prevents listener overlap assertions.
 */
export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
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
          if (!isMounted) return;
          const items = snapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          })) as T[];
          setData(items);
          setLoading(false);
          setError(null);
        },
        (serverError: any) => {
          if (!isMounted) return;
          
          // Use safer extraction for debugging
          const path = (query as any)._query?.path?.segments?.join('/') || 'collection';
          
          console.error("🔥 [Ezzy Flux] Collection Sync Error:", {
            code: serverError.code,
            path: path
          });
          
          if (serverError.code === 'permission-denied') {
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
  }, [query]); // Note: Ensure query is memoized in parent

  return { data, loading, error };
}
