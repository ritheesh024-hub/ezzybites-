'use client';

import React, { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { X, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (err: any) => {
      if (err instanceof FirestorePermissionError) {
        setError(err);
      }
    };

    errorEmitter.on('permission-error', handleError);
    return () => errorEmitter.off('permission-error', handleError);
  }, []);

  if (!error) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] animate-in slide-in-from-bottom-5">
      <Alert variant="destructive" className="bg-destructive text-destructive-foreground border-none shadow-2xl rounded-2xl relative pr-12">
        <ShieldAlert className="h-5 w-5" />
        <AlertTitle className="font-bold">Security Rules Error</AlertTitle>
        <AlertDescription className="text-sm opacity-90">
          <p>Operation: <span className="font-mono font-bold uppercase">{error.context.operation}</span></p>
          <p>Path: <span className="font-mono text-xs break-all">{error.context.path}</span></p>
          {error.context.requestResourceData && (
            <div className="mt-2 p-2 bg-black/20 rounded font-mono text-[10px] overflow-auto max-h-32">
              <pre>{JSON.stringify(error.context.requestResourceData, null, 2)}</pre>
            </div>
          )}
        </AlertDescription>
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2 hover:bg-white/20 text-white rounded-full"
          onClick={() => setError(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </Alert>
    </div>
  );
}
