
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ShoppingBag, Lock, Mail, Loader2, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const db = useFirestore();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const ADMIN_EMAIL = 'sunnyritheesh@gmail.com';

  useEffect(() => {
    if (!userLoading && user && user.email === ADMIN_EMAIL) {
      router.push('/admin/dashboard');
    }
  }, [user, userLoading, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;

    if (email !== ADMIN_EMAIL) {
      toast({
        variant: "destructive",
        title: "Unauthorized Email",
        description: "Only the designated admin email is allowed to register or login here.",
      });
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Ensure admin profile exists in Firestore to satisfy security rules
        const adminRef = doc(db, 'admins', userCredential.user.uid);
        const adminDoc = await getDoc(adminRef);
        if (!adminDoc.exists()) {
          await setDoc(adminRef, { email: email, role: 'admin' });
        }
        toast({ title: "Welcome back, Admin" });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create Admin Profile for the new user
        const adminRef = doc(db, 'admins', userCredential.user.uid);
        await setDoc(adminRef, { email: email, role: 'admin' });
        toast({ title: "Admin account created successfully" });
      }
      router.push('/admin/dashboard');
    } catch (error: any) {
      let message = error.message;
      if (error.code === 'auth/user-not-found') message = "Account not found. Try signing up.";
      if (error.code === 'auth/wrong-password') message = "Incorrect password.";
      if (error.code === 'auth/email-already-in-use') message = "Account already exists. Try logging in.";
      
      toast({
        variant: "destructive",
        title: isLogin ? "Login Failed" : "Registration Failed",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-md rounded-3xl border shadow-2xl bg-card animate-in zoom-in duration-500">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center transform rotate-12 shadow-lg shadow-primary/20">
              <ShoppingBag className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-headline font-bold">
            {isLogin ? 'Admin Login' : 'Admin Register'}
          </CardTitle>
          <CardTitle className="text-sm font-bold text-primary mt-1">Ezzy Bites Portal</CardTitle>
          <CardDescription>
            {isLogin ? 'Enter your credentials to manage Ezzy Bites.' : 'Create your secure administrator account.'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAuth}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="sunnyritheesh@gmail.com" 
                  className="pl-10 rounded-xl h-12 focus:ring-primary/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {!isLogin && email !== ADMIN_EMAIL && (
                <p className="text-[10px] text-destructive font-medium">Note: Only {ADMIN_EMAIL} can register.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-10 rounded-xl h-12 focus:ring-primary/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full h-14 rounded-xl font-bold text-lg shadow-xl shadow-primary/10" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isLogin ? 'Verifying...' : 'Creating...'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>{isLogin ? 'Sign In' : 'Sign Up'}</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </Button>
            
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary font-medium hover:underline"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>

            <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              Back to Storefront
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
