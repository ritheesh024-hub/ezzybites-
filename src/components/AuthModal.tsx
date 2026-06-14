
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
import { Loader2, Copy, Check } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase';
import { doc, setDoc, getDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Logo } from './Logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal = ({ isOpen, onClose, onSuccess }: AuthModalProps) => {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<{ message: string; domain?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  
  const auth = useAuth();
  const db = useFirestore();

  const handleCopyDomain = (domain: string) => {
    navigator.clipboard.writeText(domain);
    setCopied(true);
    toast({ title: "Domain Copied", description: "Paste this into Firebase Authorized Domains." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !db) return;
    
    setLoading(true);
    setAuthError(null);

    try {
      await setPersistence(auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // 1. Primary Admin / Staff Cross-Sync
      const PRIMARY_ADMIN_EMAIL = "sunnyritheesh@gmail.com";
      const isPrimaryAdmin = user.email === PRIMARY_ADMIN_EMAIL;

      if (isPrimaryAdmin) {
        const adminRef = doc(db, 'admins', user.uid);
        await setDoc(adminRef, {
          id: user.uid,
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          role: 'admin',
          status: 'active',
          onlineStatus: 'online',
          lastLoginAt: serverTimestamp(),
          photoUrl: user.photoURL
        }, { merge: true });
      }

      // 2. Regular User Provisioning
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          photoUrl: user.photoURL,
          rewardCoins: 50,
          orderCount: 0,
          role: 'customer',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        });
      } else {
        await setDoc(userRef, { 
          lastLoginAt: serverTimestamp(),
          photoUrl: user.photoURL || userSnap.data().photoUrl 
        }, { merge: true });
      }

      // 3. Log Login Event
      try {
        await addDoc(collection(db, 'login_events'), {
          uid: user.uid,
          email: user.email,
          name: user.displayName || 'Member',
          role: isPrimaryAdmin ? 'admin' : 'customer',
          timestamp: serverTimestamp(),
          platform: 'Web Client',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
        });
      } catch (logErr) {
        console.warn("Audit logging failed", logErr);
      }

      toast({
        title: "Authorized Successfully",
        description: `Welcome, ${user.displayName?.split(' ')[0]}.`,
      });
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        setLoading(false);
        return; 
      }

      if (error.code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : '';
        setAuthError({
          message: "Authorization required. Please add this domain to Firebase.",
          domain
        });
      } else {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: error.message || "Failed to establish connection.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="max-w-md rounded-[2.5rem] p-8 md:p-12 border-none shadow-3xl bg-white dark:bg-zinc-950">
        <DialogHeader className="text-center space-y-6">
          <div className="flex justify-center mb-2">
            <Logo size="md" hideText />
          </div>
          <div className="space-y-3">
            <DialogTitle className="text-3xl font-black font-headline tracking-tighter uppercase leading-none">
              Sign In / <span className="text-primary italic">Sign Up</span>
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
              Securely access your account to track orders and save favorites.
            </DialogDescription>
          </div>
        </DialogHeader>

        {authError && (
          <Alert variant="destructive" className="mt-6 border-none bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-400 rounded-2xl">
            <AlertTitle className="font-black text-[10px] uppercase mb-2 tracking-widest">Setup Required</AlertTitle>
            <AlertDescription className="text-[11px] font-medium leading-relaxed">
              {authError.message}
              {authError.domain && (
                <div className="mt-3 p-3 bg-white/50 dark:bg-black/20 rounded-xl flex items-center justify-between gap-2 border border-red-100 dark:border-red-900/30">
                  <code className="text-[10px] font-mono break-all">{authError.domain}</code>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 shrink-0 hover:bg-red-100"
                    onClick={() => handleCopyDomain(authError.domain!)}
                  >
                    {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-10 space-y-4">
          <Button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-16 rounded-full bg-white dark:bg-zinc-900 text-foreground border-2 border-muted hover:bg-secondary/50 transition-all font-black uppercase text-[10px] tracking-widest gap-4 shadow-sm"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
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
          
          <div className="flex items-center gap-2 justify-center py-4">
            <span className="h-px bg-border flex-1" />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-4">Secure Infrastructure</span>
            <span className="h-px bg-border flex-1" />
          </div>
          
          <div className="text-center">
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tight">
              By continuing, you agree to our Terms of Service
            </p>
          </div>
        </div>

        <DialogFooter className="mt-12">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 mx-auto">
            Ezzy Bites Premium
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
