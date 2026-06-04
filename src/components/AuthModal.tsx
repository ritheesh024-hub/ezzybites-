
'use client';

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Loader2, AlertCircle } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal = ({ isOpen, onClose, onSuccess }: AuthModalProps) => {
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const db = useFirestore();

  const handleGoogleSignIn = async () => {
    if (!auth || !db) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Authentication service is currently unavailable.",
      });
      return;
    }
    
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Save/Update user profile in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          photoUrl: user.photoURL,
          createdAt: serverTimestamp(),
          orderCount: 0
        });
      }

      toast({
        title: "Welcome to Ezzy Bites!",
        description: `Signed in as ${user.displayName}.`,
      });
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Auth error:", error);
      
      // Silent handling for user closure
      if (error.code === 'auth/popup-closed-by-user') {
        setLoading(false);
        return;
      }

      let errorMessage = "Something went wrong with Google Sign-In.";
      
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "This domain is not authorized. Please add this URL to 'Authorized Domains' in Firebase Console Settings.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Sign-in popup was blocked by your browser. Please allow popups for this site.";
      }

      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="max-w-md rounded-[2.5rem] p-10 border-none shadow-3xl bg-white dark:bg-zinc-900">
        <DialogHeader className="text-center space-y-6">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto transform rotate-12 shadow-2xl shadow-primary/20">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-3xl font-black font-headline tracking-tighter uppercase">
              Join the <span className="text-primary italic">Family.</span>
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground leading-relaxed px-4">
              Sign in to place orders, track your delivery, and unlock exclusive rewards.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="mt-10 space-y-4">
          <Button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-16 rounded-2xl bg-white dark:bg-zinc-800 text-foreground border-2 border-muted hover:bg-secondary/50 transition-all font-black uppercase text-[10px] tracking-widest gap-3 shadow-sm"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c1.61-1.48 2.53-3.66 2.53-6.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </>
            )}
          </Button>
          
          <div className="flex items-center gap-2 justify-center p-3 bg-secondary/30 rounded-xl">
            <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-[9px] font-bold text-muted-foreground uppercase">Please enable popups to sign in</p>
          </div>
          
          <p className="text-[9px] text-center text-muted-foreground font-bold uppercase tracking-widest opacity-50 px-8">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <DialogFooter className="mt-8 border-t pt-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mx-auto">
            Ezzy Bites Premium Fast Food
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
