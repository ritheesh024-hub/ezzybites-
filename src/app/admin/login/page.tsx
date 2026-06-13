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
  ChevronLeft, RefreshCw, AlertCircle, Info, Copy, Check
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { doc, setDoc, getDoc, collection, getDocs, limit, query, updateDoc, serverTimestamp, where, deleteDoc } from 'firebase/firestore';
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
  const [isFirstSetup, setIsFirstSetup] = useState(false);
  const [systemChecked, setSystemChecked] = useState(false);
  const [authError, setAuthError] = useState<{ message: string; domain?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  
  const auth = useAuth();
  const db = useFirestore();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const PRIMARY_ADMIN_EMAIL = "sunnyritheesh@gmail.com";

  useEffect(() => {
    async function checkSystemState() {
      if (!db) return;
      try {
        const adminsColl = collection(db, 'admins');
        const allAdminsSnap = await getDocs(query(adminsColl, limit(1)));
        const isEmpty = allAdminsSnap.empty;
        setIsFirstSetup(isEmpty);
        setSystemChecked(true);
      } catch (e) {
        console.error("System check failed", e);
        setIsFirstSetup(true);
        setSystemChecked(true);
      }
    }
    checkSystemState();
  }, [db]);

  useEffect(() => {
    async function checkExistingAuth() {
      if (!userLoading && user && db) {
        try {
          const adminRef = doc(db, 'admins', user.uid);
          const adminSnap = await getDoc(adminRef);
          if (adminSnap.exists() && adminSnap.data().status === 'active') {
            router.push('/admin/dashboard');
          }
        } catch (e) {
          console.error("Error checking existing auth:", e);
        }
      }
    }
    checkExistingAuth();
  }, [user, userLoading, router, db]);

  const handleRoleSelect = (role: SelectedRole) => {
    setSelectedRole(role);
    setStep('auth');
    if (role === 'admin' && !email) {
      setEmail(PRIMARY_ADMIN_EMAIL);
    }
  };

  const handleForgotPassword = async () => {
    if (!auth || !email) {
      toast({ variant: "destructive", title: "Email Required", description: "Please enter your staff email first." });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: "Reset Link Sent", description: `Check your inbox at ${email}` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleCopyDomain = (domain: string) => {
    navigator.clipboard.writeText(domain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Domain Copied" });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    if (!auth || !db) {
      toast({ variant: "destructive", title: "Connection Error" });
      return;
    }

    setLoading(true);
    try {
      let userCredential;
      const normalizedEmail = email.trim().toLowerCase();

      try {
        userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      } catch (signInError: any) {
        if (signInError.code === 'auth/unauthorized-domain') {
          const domain = window.location.hostname;
          setAuthError({ message: "This domain is not authorized in Firebase.", domain });
          setLoading(false);
          return;
        }

        if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential' || signInError.code === 'auth/invalid-email') {
          try {
            userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
            toast({ title: "Account Created", description: "Staff credentials initialized." });
          } catch (createError: any) {
            if (createError.code === 'auth/email-already-in-use') {
              toast({ variant: "destructive", title: "Login Failed", description: "Incorrect password for this staff account." });
              setLoading(false);
              return;
            }
            toast({ variant: "destructive", title: "Auth Error", description: createError.message });
            setLoading(false);
            return;
          }
        } else {
          toast({ variant: "destructive", title: "Login Failed", description: signInError.message });
          setLoading(false);
          return;
        }
      }

      const uid = userCredential.user.uid;
      const adminRef = doc(db, 'admins', uid);
      let adminSnap = await getDoc(adminRef);

      const adminsColl = collection(db, 'admins');
      const emailQuery = query(adminsColl, where('email', '==', normalizedEmail));
      const emailSnap = await getDocs(emailQuery);
      
      let existingRecordData = null;
      let oldRecordIds: string[] = [];

      emailSnap.docs.forEach(docSnap => {
        if (docSnap.id !== uid) {
          oldRecordIds.push(docSnap.id);
          if (!existingRecordData || docSnap.data().lastLoginAt) {
            existingRecordData = docSnap.data();
          }
        }
      });

      if (oldRecordIds.length > 0 || normalizedEmail === PRIMARY_ADMIN_EMAIL) {
        const isPrimary = normalizedEmail === PRIMARY_ADMIN_EMAIL;
        
        const migratedData = {
          ...(existingRecordData || {}),
          id: uid,
          uid: uid,
          email: normalizedEmail,
          lastLoginAt: serverTimestamp(),
          onlineStatus: 'online',
          status: isPrimary ? 'active' : (existingRecordData as any)?.status || 'active',
          role: isPrimary ? 'admin' : (existingRecordData as any)?.role || selectedRole || 'cashier'
        };
        
        await setDoc(adminRef, migratedData, { merge: true });
        for (const oldId of oldRecordIds) {
          await deleteDoc(doc(db, 'admins', oldId));
        }
        
        toast({ title: isPrimary ? "Admin Restored" : "Account Synced", description: "Identity verified." });
        router.push('/admin/dashboard');
        return;
      }

      if (!adminSnap.exists()) {
        const isPrimary = normalizedEmail === PRIMARY_ADMIN_EMAIL;
        const firstAdminData = { 
          id: uid,
          uid: uid,
          email: normalizedEmail, 
          name: normalizedEmail.split('@')[0],
          role: isPrimary ? 'admin' : (selectedRole || 'cashier'),
          status: isPrimary ? 'active' : 'disabled',
          onlineStatus: 'online',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          stats: { ordersHandled: 0, billsGenerated: 0, kitchenUpdates: 0 }
        };
        await setDoc(adminRef, firstAdminData);
        
        if (isPrimary || isFirstSetup) {
           toast({ title: "Admin Access Granted", description: "Profile activated." });
           router.push('/admin/dashboard');
        } else {
           toast({ title: "Access Requested", description: "Pending administrator approval." });
           await signOut(auth);
           setStep('selection');
        }
        return;
      }

      const data = adminSnap.data();
      if (data.status === 'disabled') {
        if (normalizedEmail === PRIMARY_ADMIN_EMAIL) {
          await updateDoc(adminRef, { status: 'active', role: 'admin' });
        } else {
          await signOut(auth);
          toast({ variant: "destructive", title: "Access Denied", description: "Your staff account is disabled." });
          setLoading(false);
          return;
        }
      }
      
      await updateDoc(adminRef, { 
        lastLoginAt: serverTimestamp(),
        onlineStatus: 'online'
      });
      
      toast({ title: "Authorized", description: `Signed in as ${data.role.toUpperCase()}` });
      router.push('/admin/dashboard');

    } catch (error: any) {
      console.error('Auth error:', error);
      toast({ variant: "destructive", title: "Login Failed", description: error.message || "Failed to authenticate." });
    } finally {
      setLoading(false);
    }
  };

  if (!systemChecked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Connecting to Ops Core...</p>
      </div>
    );
  }

  if (step === 'selection') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="text-center mb-12 space-y-4">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto transform rotate-12 shadow-2xl shadow-primary/20">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black font-headline tracking-tighter">Ezzy<span className="text-primary italic">Ops</span></h1>
          <p className="text-muted-foreground text-xs font-black uppercase tracking-[0.3em]">Operational Access</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          <RoleCard icon={ShieldCheck} title="Executive Admin" desc="Platform control & analytics" color="bg-primary" onClick={() => handleRoleSelect('admin')} />
          <RoleCard icon={Receipt} title="Billing Cashier" desc="POS & Dine-in management" color="bg-blue-600" onClick={() => handleRoleSelect('cashier')} />
          <RoleCard icon={ChefHat} title="Kitchen Chef" desc="Live orders & status" color="bg-orange-500" onClick={() => handleRoleSelect('kitchen')} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-md rounded-[2.5rem] border shadow-2xl bg-card animate-in zoom-in duration-500 overflow-hidden relative">
        <div className={cn("h-2 w-full", 
          selectedRole === 'admin' ? "bg-primary" : 
          selectedRole === 'cashier' ? "bg-blue-600" : "bg-orange-500"
        )} />
        
        <CardHeader className="space-y-2 text-center pb-8 pt-10">
          <button 
            onClick={() => setStep('selection')}
            className="absolute left-6 top-8 text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 text-[10px] font-black uppercase"
          >
            <ChevronLeft className="w-3 h-3" /> Back
          </button>
          
          <div className="flex justify-center mb-4">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all",
              selectedRole === 'admin' ? "bg-primary" : 
              selectedRole === 'cashier' ? "bg-blue-600" : "bg-orange-500"
            )}>
              {selectedRole === 'admin' && <ShieldCheck className="w-6 h-6 text-white" />}
              {selectedRole === 'cashier' && <Receipt className="w-6 h-6 text-white" />}
              {selectedRole === 'kitchen' && <ChefHat className="w-6 h-6 text-white" />}
            </div>
          </div>
          <CardTitle className="text-2xl font-black font-headline uppercase tracking-tighter">
            {selectedRole?.toUpperCase()} Login
          </CardTitle>
          <CardDescription className="font-bold text-[10px] uppercase tracking-widest opacity-60">
            Internal Staff Verification
          </CardDescription>
        </CardHeader>

        {authError && (
          <div className="px-8 pb-6">
            <Alert variant="destructive" className="border-none bg-red-50 text-red-900 rounded-2xl">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-[10px] font-black uppercase tracking-widest">Domain Blocked</AlertTitle>
              <AlertDescription className="text-[11px] font-medium leading-relaxed">
                {authError.message} Add this domain to Firebase Authorized Domains:
                <div className="mt-3 p-3 bg-white/50 rounded-xl flex items-center justify-between border border-red-100">
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
                  className="h-14 pl-12 rounded-xl font-bold border-muted bg-secondary/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Password</Label>
                <button type="button" onClick={handleForgotPassword} className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">Forgot?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="password" 
                  className="h-14 pl-12 rounded-xl border-muted bg-secondary/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {email === PRIMARY_ADMIN_EMAIL && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800 flex gap-3 items-start">
                <RefreshCw className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-[9px] font-black text-green-700 dark:text-green-400 leading-tight uppercase">
                  Primary identity recognized. Verification auto-sync enabled.
                </p>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 pb-12 pt-6 px-8">
            <Button 
              type="submit" 
              className={cn(
                "w-full h-16 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 text-white",
                selectedRole === 'admin' ? "bg-primary shadow-primary/20" : 
                selectedRole === 'cashier' ? "bg-blue-600 shadow-blue-500/20" : "bg-orange-500 shadow-orange-500/20"
              )} 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <div className="flex items-center gap-3">
                  <span>Enter Console</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

function RoleCard({ icon: Icon, title, desc, color, onClick }: any) {
  return (
    <Card 
      onClick={onClick}
      className="group rounded-[2.5rem] border-none shadow-xl hover:shadow-2xl transition-all cursor-pointer overflow-hidden bg-card"
    >
      <CardContent className="p-8 space-y-6">
        <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg transform group-hover:rotate-12 group-hover:scale-110 transition-all", color)}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black font-headline uppercase tracking-tighter">{title}</h3>
          <p className="text-xs font-medium text-muted-foreground leading-relaxed">{desc}</p>
        </div>
        <div className="pt-4 flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest opacity-0 group-hover:opacity-100 transition-all">
          Authorize <ArrowRight className="w-3 h-3" />
        </div>
      </CardContent>
    </Card>
  );
}