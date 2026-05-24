
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ShoppingBag, Lock, Mail, Loader2, ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { doc, setDoc, getDoc, collection, getDocs, limit, query } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminLoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const db = useFirestore();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    async function checkExistingAuth() {
      if (!userLoading && user && db) {
        const adminRef = doc(db, 'admins', user.uid);
        const adminSnap = await getDoc(adminRef);
        if (adminSnap.exists()) {
          router.push('/admin/dashboard');
        }
      }
    }
    checkExistingAuth();
  }, [user, userLoading, router, db]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!auth || !db) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Firebase services are not initialized. Please ensure your configuration is correct.",
      });
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const adminRef = doc(db, 'admins', userCredential.user.uid);
        const adminSnap = await getDoc(adminRef);
        
        if (!adminSnap.exists()) {
          // Fallback: If auth exists but no record, check if this is the first user
          const adminsColl = collection(db, 'admins');
          const adminsSnap = await getDocs(query(adminsColl, limit(1)));
          
          if (adminsSnap.empty) {
            await setDoc(adminRef, { email: email, role: 'admin', createdAt: new Date() });
          } else {
            throw new Error("This account is not authorized as a staff member.");
          }
        }
        toast({ title: "Authorized", description: "Welcome to the operational console." });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const adminRef = doc(db, 'admins', userCredential.user.uid);
        
        // Check if this is the first admin ever
        const adminsColl = collection(db, 'admins');
        const adminsSnap = await getDocs(query(adminsColl, limit(1)));
        const role = adminsSnap.empty ? 'admin' : 'cashier'; // First user is admin, others are cashier by default

        await setDoc(adminRef, { 
          email: email, 
          role: role,
          createdAt: new Date() 
        });
        
        toast({ 
          title: "Account Created", 
          description: `You have been registered as ${role}.` 
        });
      }
      router.push('/admin/dashboard');
    } catch (error: any) {
      console.error('Auth error:', error);
      let message = error.message;
      if (error.code === 'auth/user-not-found') message = "Account not found.";
      if (error.code === 'auth/wrong-password') message = "Incorrect password.";
      if (error.code === 'auth/invalid-credential') message = "Invalid credentials provided.";
      if (error.code === 'auth/email-already-in-use') message = "This email is already registered.";
      
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-md rounded-[2.5rem] border shadow-2xl bg-card animate-in zoom-in duration-500">
        <CardHeader className="space-y-2 text-center pb-8 pt-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center transform rotate-12 shadow-xl shadow-primary/20">
              <ShoppingBag className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-headline font-black">Staff Portal</CardTitle>
          <CardDescription className="font-bold text-xs uppercase tracking-widest opacity-60">
            Ezzy Bites Operational Console
          </CardDescription>
        </CardHeader>

        {!auth ? (
          <div className="px-8 pb-10">
            <Alert variant="destructive" className="rounded-2xl bg-destructive/5 border-destructive/20 border-dashed py-6">
              <AlertTriangle className="h-6 w-6 mb-2" />
              <AlertTitle className="font-black uppercase text-xs tracking-widest mb-2">Connection Missing</AlertTitle>
              <AlertDescription className="text-[10px] font-medium leading-relaxed opacity-80">
                The application cannot connect to the authentication service. Please check your network connection.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <form onSubmit={handleAuth}>
            <CardContent className="space-y-6 px-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="email" 
                    placeholder="name@restaurant.com" 
                    className="h-14 pl-12 rounded-xl font-bold border-muted bg-secondary/20"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="password" 
                    className="h-14 pl-12 rounded-xl border-muted bg-secondary/20"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 px-1">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Authorized Access Only</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pb-12 pt-6 px-8">
              <Button 
                type="submit" 
                className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all active:scale-95 bg-primary text-white" 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <div className="flex items-center gap-3">
                    <span>{isLogin ? 'Sign In' : 'Register'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </Button>
              
              <button 
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-[10px] text-muted-foreground font-black uppercase tracking-widest hover:text-primary transition-colors"
              >
                {isLogin ? "Need a staff account? Register" : "Already have an account? Login"}
              </button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
