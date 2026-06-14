
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
  ShoppingBag, Lock, Mail, Loader2, ArrowRight, 
  ShieldCheck, Receipt, ChefHat, 
  ChevronLeft, AlertCircle, Copy, Check
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { doc, setDoc, getDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type LoginStep = 'selection' | 'auth';
type SelectedRole = 'admin' | 'cashier' | 'kitchen';

export default function AdminLoginPage() {
  const [step, setStep] = useState<LoginStep>('selection');
  const [selectedRole, setSelectedRole] = useState<SelectedRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [systemChecked, setSystemChecked] = useState(false);
  const [authError, setAuthError] = useState<{ message: string; domain?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  
  const auth = useAuth();
  const db = useFirestore();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const PRIMARY_ADMIN_EMAIL = "sunnyritheesh@gmail.com";

  useEffect(() => {
    async function checkExistingAuth() {
      if (!userLoading && user && db) {
        try {
          const adminRef = doc(db, 'admins', user.uid);
          const adminSnap = await getDoc(adminRef);
          
          if (user.email === PRIMARY_ADMIN_EMAIL || (adminSnap.exists() && adminSnap.data().status === 'active')) {
            router.push('/admin/dashboard');
          }
        } catch (e) {
          console.error("Auth check failed:", e);
        }
      }
      setSystemChecked(true);
    }
    checkExistingAuth();
  }, [user, userLoading, router, db]);

  const handleRoleSelect = (role: SelectedRole) => {
    setSelectedRole(role);
    setStep('auth');
    if (role === 'admin') {
      setEmail(PRIMARY_ADMIN_EMAIL);
    } else {
      setEmail('');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ variant: "destructive", title: "Email Required", description: "Please enter your staff email first." });
      return;
    }
    if (!auth) return;

    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: "Reset Link Sent", description: `Check ${email} for instructions.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    if (!auth || !db) {
      toast({ variant: "destructive", title: "Connection Error", description: "Firebase services not initialized." });
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const isPrimary = normalizedEmail === PRIMARY_ADMIN_EMAIL;
      let uid = '';

      // 1. Authenticate
      try {
        const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        uid = userCredential.user.uid;
      } catch (signInError: any) {
        // Master Admin Auto-Provision Path
        if (isPrimary && (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential')) {
           try {
             const createCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
             uid = createCredential.user.uid;
             toast({ title: "Identity Established", description: "Master admin account synchronized." });
           } catch (createError: any) {
             if (createError.code === 'auth/email-already-in-use') {
                // Wrong password if email exists
                toast({ variant: "destructive", title: "Auth Failed", description: "Incorrect password for this staff email." });
                setLoading(false);
                return;
             }
             throw createError;
           }
        } else {
          throw signInError;
        }
      }

      // 2. Synchronize Firestore Admin Record
      const adminRef = doc(db, 'admins', uid);
      
      if (isPrimary) {
        const adminData = { 
          id: uid,
          uid: uid,
          email: normalizedEmail, 
          name: "Master Admin",
          role: 'admin',
          status: 'active',
          onlineStatus: 'online',
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(adminRef, adminData, { merge: true });
        toast({ title: "Access Granted", description: "Master Console synchronized." });
      } else {
        const adminSnap = await getDoc(adminRef);
        if (!adminSnap.exists()) {
           await signOut(auth);
           toast({ variant: "destructive", title: "Access Denied", description: "Staff record not found." });
           setLoading(false);
           return;
        }
        if (adminSnap.data().status === 'disabled') {
           await signOut(auth);
           toast({ variant: "destructive", title: "Account Blocked", description: "Your staff account is inactive." });
           setLoading(false);
           return;
        }
        await setDoc(adminRef, { lastLoginAt: serverTimestamp(), onlineStatus: 'online' }, { merge: true });
      }

      // 3. Log Login Event
      try {
        await addDoc(collection(db, 'login_events'), {
          uid,
          email: normalizedEmail,
          name: isPrimary ? "Master Admin" : (normalizedEmail.split('@')[0]),
          role: isPrimary ? 'admin' : (selectedRole || 'staff'),
          timestamp: serverTimestamp(),
          platform: 'Admin Dashboard',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
        });
      } catch (logErr) {
        console.warn("Audit logging failed", logErr);
      }

      router.push('/admin/dashboard');

    } catch (error: any) {
      console.error('Auth Error:', error);
      
      let message = error.message || "An unexpected error occurred.";
      
      if (error.code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : '';
        setAuthError({ message: "This domain is not authorized in Firebase.", domain });
        setLoading(false);
        return;
      }

      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        message = "Incorrect password for this staff account.";
      }

      toast({ variant: "destructive", title: "Authentication Failed", description: message });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDomain = (domain: string) => {
    navigator.clipboard.writeText(domain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Domain Copied" });
  };

  if (!systemChecked) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  if (step === 'selection') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="text-center mb-12 space-y-4">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto transform rotate-12 shadow-2xl shadow-primary/20">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black font-headline tracking-tighter">Ezzy<span className="text-primary italic">Ops</span></h1>
          <p className="text-muted-foreground text-xs font-black uppercase tracking-[0.3em]">Operational Access Hub</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          <RoleCard icon={ShieldCheck} title="Master Admin" desc="Platform control & analytics" color="bg-primary" onClick={() => handleRoleSelect('admin')} />
          <RoleCard icon={Receipt} title="Counter Cashier" desc="POS & Billing operations" color="bg-blue-600" onClick={() => handleRoleSelect('cashier')} />
          <RoleCard icon={ChefHat} title="Kitchen Station" desc="Live cooking & dispatch" color="bg-orange-500" onClick={() => handleRoleSelect('kitchen')} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-md rounded-[2.5rem] border shadow-2xl bg-card overflow-hidden">
        <div className={cn("h-2 w-full", selectedRole === 'admin' ? "bg-primary" : selectedRole === 'cashier' ? "bg-blue-600" : "bg-orange-500")} />
        
        <CardHeader className="space-y-2 text-center pb-8 pt-10 relative">
          <button onClick={() => setStep('selection')} className="absolute left-6 top-8 text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 text-[10px] font-black uppercase">
            <ChevronLeft className="w-3 h-3" /> Back
          </button>
          
          <div className="flex justify-center mb-4">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg", selectedRole === 'admin' ? "bg-primary" : selectedRole === 'cashier' ? "bg-blue-600" : "bg-orange-500")}>
              {selectedRole === 'admin' && <ShieldCheck className="w-6 h-6 text-white" />}
              {selectedRole === 'cashier' && <Receipt className="w-6 h-6 text-white" />}
              {selectedRole === 'kitchen' && <ChefHat className="w-6 h-6 text-white" />}
            </div>
          </div>
          <CardTitle className="text-2xl font-black font-headline uppercase tracking-tighter">{selectedRole?.toUpperCase()} Login</CardTitle>
          <CardDescription className="font-bold text-[10px] uppercase tracking-widest opacity-60">Identity Verification</CardDescription>
        </CardHeader>

        {authError && (
          <div className="px-8 pb-6">
            <Alert variant="destructive" className="border-none bg-red-50 text-red-900 rounded-2xl">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-[10px] font-black uppercase tracking-widest">Setup Required</AlertTitle>
              <AlertDescription className="text-[11px]">
                Add this domain to Firebase Authorized Domains:
                <div className="mt-2 p-3 bg-white/50 rounded-xl flex items-center justify-between border border-red-100">
                  <code className="text-[9px] font-mono break-all">{authError.domain}</code>
                  <button onClick={() => handleCopyDomain(authError.domain!)} className="p-1.5 hover:bg-white rounded-lg transition-colors">
                    {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <form onSubmit={handleAuth}>
          <CardContent className="space-y-6 px-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Staff Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="email" 
                  placeholder="name@ezzybites.com" 
                  className="h-14 pl-12 rounded-xl font-bold bg-secondary/20" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  disabled={selectedRole === 'admin'} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Password</Label>
                <button type="button" onClick={handleForgotPassword} className="text-[9px] font-black text-primary uppercase hover:underline">Forgot?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="password" 
                  className="h-14 pl-12 rounded-xl bg-secondary/20" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  minLength={6} 
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="pb-12 pt-6 px-8">
            <Button type="submit" className={cn("w-full h-16 rounded-2xl font-black text-lg shadow-xl text-white", selectedRole === 'admin' ? "bg-primary" : selectedRole === 'cashier' ? "bg-blue-600" : "bg-orange-500")} disabled={loading}>
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <div className="flex items-center gap-3"><span>Enter Hub</span><ArrowRight className="w-5 h-5" /></div>}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

function RoleCard({ icon: Icon, title, desc, color, onClick }: any) {
  return (
    <Card onClick={onClick} className="group rounded-[2.5rem] border-none shadow-xl hover:shadow-2xl transition-all cursor-pointer bg-card">
      <CardContent className="p-8 space-y-6 text-center">
        <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-all mx-auto", color)}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black font-headline uppercase tracking-tighter">{title}</h3>
          <p className="text-xs font-medium text-muted-foreground leading-relaxed">{desc}</p>
        </div>
        <div className="pt-4 flex items-center justify-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest opacity-0 group-hover:opacity-100 transition-all">
          Select <ArrowRight className="w-3 h-3" />
        </div>
      </CardContent>
    </Card>
  );
}
