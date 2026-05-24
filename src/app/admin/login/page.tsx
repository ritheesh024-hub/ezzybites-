'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
  ShoppingBag, Lock, Mail, Loader2, ArrowRight, 
  AlertTriangle, ShieldCheck, Receipt, ChefHat, 
  ChevronLeft, Fingerprint, UserCircle 
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
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFirstSetup, setIsFirstSetup] = useState(false);
  
  const auth = useAuth();
  const db = useFirestore();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    async function checkSystemState() {
      if (!db) return;
      try {
        const adminsColl = collection(db, 'admins');
        const allAdminsSnap = await getDocs(query(adminsColl, limit(1)));
        if (allAdminsSnap.empty) {
          setIsFirstSetup(true);
          // If first setup, default to Registration
          setIsLogin(false);
        }
      } catch (e) {
        console.error("System check failed", e);
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
          if (adminSnap.exists()) {
            router.push('/admin/dashboard');
          }
        } catch (e) {
          console.error("Error checking existing auth record:", e);
        }
      }
    }
    checkExistingAuth();
  }, [user, userLoading, router, db]);

  const handleRoleSelect = (role: SelectedRole) => {
    setSelectedRole(role);
    setStep('auth');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!auth || !db) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Firebase services are not initialized.",
      });
      return;
    }

    setLoading(true);
    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }

      const uid = userCredential.user.uid;
      const adminRef = doc(db, 'admins', uid);
      const adminSnap = await getDoc(adminRef);

      // 1. If profile already exists under this UID
      if (adminSnap.exists()) {
        const data = adminSnap.data();
        if (data.status === 'disabled') {
          await auth.signOut();
          throw new Error("This account has been disabled by the administrator.");
        }
        
        await updateDoc(adminRef, { 
          lastLoginAt: serverTimestamp(),
          onlineStatus: 'online'
        });
        toast({ title: "Authorized", description: `Logged in as ${data.role.toUpperCase()}.` });
        router.push('/admin/dashboard');
        return;
      }

      // 2. If profile doesn't exist for UID, check by Email (migration fallback)
      const q = query(collection(db, 'admins'), where('email', '==', email.toLowerCase()), limit(1));
      const emailQuerySnap = await getDocs(q);

      if (!emailQuerySnap.empty) {
        const oldDoc = emailQuerySnap.docs[0];
        const oldData = oldDoc.data();
        
        // Migrate old record to use new UID
        await setDoc(adminRef, {
          ...oldData,
          id: uid,
          lastLoginAt: serverTimestamp(),
          onlineStatus: 'online'
        });

        // Delete old ghost record if it has a different ID
        if (oldDoc.id !== uid) {
          await deleteDoc(oldDoc.ref);
        }

        toast({ title: "Profile Linked", description: "Your staff account is now activated." });
        router.push('/admin/dashboard');
        return;
      }

      // 3. If no record exists at all, check if this is the very first user
      const adminsColl = collection(db, 'admins');
      const allAdminsSnap = await getDocs(query(adminsColl, limit(1)));
      
      if (allAdminsSnap.empty) {
        // PROVISION FIRST ADMIN
        await setDoc(adminRef, { 
          id: uid,
          email: email.toLowerCase(), 
          name: email.split('@')[0],
          role: 'admin',
          status: 'active',
          onlineStatus: 'online',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          stats: { ordersHandled: 0, billsGenerated: 0, kitchenUpdates: 0 }
        });
        toast({ title: "Welcome, Admin", description: "First administrative profile created." });
        router.push('/admin/dashboard');
      } else {
        if (isLogin) {
          await auth.signOut();
          throw new Error("This account is not authorized as a staff member.");
        } else {
          // New registration for non-first user
          await setDoc(adminRef, { 
            id: uid,
            email: email.toLowerCase(), 
            name: email.split('@')[0],
            role: selectedRole || 'cashier',
            status: 'disabled', 
            onlineStatus: 'offline',
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            stats: { ordersHandled: 0, billsGenerated: 0, kitchenUpdates: 0 }
          });
          await auth.signOut();
          throw new Error("Registration submitted. Please ask an Admin to enable your account.");
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      let errorMessage = error.message || "Failed to authenticate.";
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = "Incorrect email or password. If you haven't registered yet, please click 'Register' below.";
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Try signing in instead.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Minimum 6 characters required.";
      }

      toast({
        variant: "destructive",
        title: "Access Error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'selection') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="text-center mb-12 space-y-4">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto transform rotate-12 shadow-2xl shadow-primary/20">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black font-headline tracking-tighter">Ezzy<span className="text-primary italic">Ops</span></h1>
          <p className="text-muted-foreground text-xs font-black uppercase tracking-[0.3em]">Operational Gateways</p>
        </div>

        {isFirstSetup && (
          <Alert className="max-w-xl mb-8 bg-primary/10 border-primary/20 rounded-2xl">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary font-black uppercase text-[10px] tracking-widest">Initial System Setup</AlertTitle>
            <AlertDescription className="text-xs font-medium">
              No staff members detected. The first user to register will be granted <strong>Executive Admin</strong> privileges.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          <RoleCard 
            icon={ShieldCheck} 
            title="Executive Admin" 
            desc="Full platform control, analytics & settings" 
            color="bg-primary"
            onClick={() => handleRoleSelect('admin')}
          />
          <RoleCard 
            icon={Receipt} 
            title="Billing Cashier" 
            desc="POS, Billing & Dine-in management" 
            color="bg-blue-600"
            onClick={() => handleRoleSelect('cashier')}
          />
          <RoleCard 
            icon={ChefHat} 
            title="Kitchen Chef" 
            desc="Live orders & preparation status" 
            color="bg-orange-500"
            onClick={() => handleRoleSelect('kitchen')}
          />
        </div>
        
        <p className="mt-12 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">
          Authorized Staff Personnel Only
        </p>
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
            {selectedRole} {isLogin ? 'Sign In' : 'Registration'}
          </CardTitle>
          <CardDescription className="font-bold text-[10px] uppercase tracking-widest opacity-60">
            {isFirstSetup ? 'Provisioning First Admin Account' : 'Ezzy Bites Operational Console'}
          </CardDescription>
        </CardHeader>

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
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Staff Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="password" 
                  className="h-14 pl-12 rounded-xl border-muted bg-secondary/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  min={6}
                />
              </div>
            </div>
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
                  <span>{isLogin ? 'Sign In' : 'Register Now'}</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </Button>
            
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] text-muted-foreground font-black uppercase tracking-widest hover:text-primary transition-colors"
            >
              {isLogin ? "New to staff? Register Account" : "Existing account? Sign In"}
            </button>
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
          Select Gateway <ArrowRight className="w-3 h-3" />
        </div>
      </CardContent>
    </Card>
  );
}
