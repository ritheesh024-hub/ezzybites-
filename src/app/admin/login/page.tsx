
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ShoppingBag, Lock, Mail, Loader2, ArrowRight, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
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

  const ADMIN_EMAIL = 'sunnyritheesh@gmail.com';

  useEffect(() => {
    if (!userLoading && user && user.email === ADMIN_EMAIL) {
      router.push('/admin/dashboard');
    }
  }, [user, userLoading, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!auth) {
      toast({
        variant: "destructive",
        title: "System Error",
        description: "Firebase Authentication is not initialized. Please check your .env file and Firebase Console.",
      });
      return;
    }

    if (!db) {
      toast({
        variant: "destructive",
        title: "Database Error",
        description: "Firestore is not initialized. Check your project configuration.",
      });
      return;
    }

    if (email !== ADMIN_EMAIL) {
      toast({
        variant: "destructive",
        title: "Unauthorized Email",
        description: `Only ${ADMIN_EMAIL} is authorized to access the Admin Panel.`,
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
      if (error.code === 'auth/invalid-api-key') message = "Firebase API key is invalid. Check your environment variables.";
      if (error.code === 'auth/operation-not-allowed') message = "Email/Password sign-in is not enabled in Firebase Console.";
      
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
      <Card className="w-full max-w-md rounded-[2rem] border shadow-2xl bg-card animate-in zoom-in duration-500">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center transform rotate-12 shadow-lg shadow-primary/20">
              <ShoppingBag className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-headline font-black">
            {isLogin ? 'Admin Login' : 'Admin Register'}
          </CardTitle>
          <CardDescription className="font-medium">
            Authorized access only for <span className="text-primary font-bold">{ADMIN_EMAIL}</span>
          </CardDescription>
        </CardHeader>

        {!auth && (
          <div className="px-6 pb-4">
            <Alert variant="destructive" className="rounded-xl bg-destructive/10 border-destructive/20">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-bold">Firebase Not Connected</AlertTitle>
              <AlertDescription className="text-[10px] leading-relaxed">
                Authentication services are currently unavailable. Ensure you have enabled <b>Email/Password</b> provider in the Firebase Console.
              </AlertDescription>
            </Alert>
          </div>
        )}

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
                  className="pl-10 rounded-xl h-12 focus:ring-primary/20 font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
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
          <CardFooter className="flex flex-col gap-4 pb-8">
            <Button 
              type="submit" 
              className="w-full h-14 rounded-xl font-black text-lg shadow-xl shadow-primary/10 transition-all active:scale-95" 
              disabled={loading || !auth}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>{isLogin ? 'Sign In' : 'Register Now'}</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </Button>
            
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-muted-foreground font-bold hover:text-primary transition-colors"
            >
              {isLogin ? "Need a new admin account? Register" : "Already registered? Sign In"}
            </button>

            <Link href="/" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-bold mt-2">
              Back to Storefront
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
