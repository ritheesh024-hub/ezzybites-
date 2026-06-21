
'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { collection, query, where, doc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { 
  Settings, 
  Bell, 
  Lock, 
  Loader2, 
  Moon, 
  Sun, 
  Volume2, 
  Trash2, 
  AlertTriangle,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/app/lib/store';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useStore();
  const [isDeleting, setIsDeleting] = useState(false);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const handleUpdate = () => {
    toast({ title: "Settings Saved", description: "Your preferences have been updated live." });
  };

  const handleDeleteAccount = async () => {
    if (!user || !db || !auth) return;

    setIsDeleting(true);
    try {
      // 1. Purge data from Firestore using a batch for atomicity
      const batch = writeBatch(db);

      // Delete addresses
      const addrQuery = query(collection(db, 'addresses'), where('userId', '==', user.uid));
      const addrSnap = await getDocs(addrQuery);
      addrSnap.docs.forEach((d) => batch.delete(d.ref));

      // Delete notifications
      const notifQuery = query(collection(db, 'user_notifications', user.uid, 'items'));
      const notifSnap = await getDocs(notifQuery);
      notifSnap.docs.forEach((d) => batch.delete(d.ref));

      // Delete user profile
      batch.delete(doc(db, 'users', user.uid));

      await batch.commit();

      // 2. Delete user from Firebase Auth
      await deleteUser(user);

      toast({ 
        title: "Account Deleted", 
        description: "Your account and data have been permanently removed." 
      });
      
      router.push('/');
    } catch (error: any) {
      console.error("Account deletion failed:", error);
      
      // Handle the "requires-recent-login" security rule from Firebase Auth
      if (error.code === 'auth/requires-recent-login') {
        toast({
          variant: "destructive",
          title: "Security Verification Required",
          description: "Please sign out and sign in again to verify your identity before deleting your account.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Deletion Failed",
          description: error.message || "An unexpected error occurred during the purge.",
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 max-w-2xl">
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black font-headline uppercase tracking-tighter">App <span className="text-primary italic">Settings.</span></h1>
              <p className="text-muted-foreground text-xs font-medium tracking-tight">Configure your interaction nodes.</p>
            </div>
          </div>

          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 overflow-hidden">
            <CardHeader className="px-8 pt-8 border-b border-dashed mb-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Visual Interface</CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-4">
              <div className="flex items-center justify-between p-5 bg-secondary/30 rounded-[1.5rem] border border-transparent hover:border-primary/10 transition-all">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm">
                     {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
                   </div>
                   <div className="space-y-0.5">
                     <p className="font-black text-xs uppercase">Dark Mode</p>
                     <p className="text-[9px] font-bold opacity-40 uppercase">Low-light optimized</p>
                   </div>
                 </div>
                 <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
              </div>
              
              <div className="flex items-center justify-between p-5 bg-secondary/30 rounded-[1.5rem] border border-transparent hover:border-primary/10 transition-all">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm">
                     <Volume2 className="w-5 h-5 text-blue-500" />
                   </div>
                   <div className="space-y-0.5">
                     <p className="font-black text-xs uppercase">Audio Feedback</p>
                     <p className="text-[9px] font-bold opacity-40 uppercase">Interface signals</p>
                   </div>
                 </div>
                 <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 overflow-hidden">
            <CardHeader className="px-8 pt-8 border-b border-dashed mb-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Privacy Engine</CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-4">
              <div className="flex items-center justify-between p-5 bg-secondary/30 rounded-[1.5rem] border border-transparent hover:border-primary/10 transition-all">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm">
                     <Bell className="w-5 h-5 text-orange-500" />
                   </div>
                   <div className="space-y-0.5">
                     <p className="font-black text-xs uppercase">Push Signals</p>
                     <p className="text-[9px] font-bold opacity-40 uppercase">Live order tracking</p>
                   </div>
                 </div>
                 <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-5 bg-secondary/10 rounded-[1.5rem] opacity-50">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm">
                     <Lock className="w-5 h-5 text-green-500" />
                   </div>
                   <div className="space-y-0.5">
                     <p className="font-black text-xs uppercase">2-Factor Auth</p>
                     <p className="text-[9px] font-bold opacity-40 uppercase">Secondary verification</p>
                   </div>
                 </div>
                 <Badge variant="outline" className="text-[8px] uppercase font-black px-2 py-0.5 rounded-md border-none bg-secondary">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>

          <div className="pt-6 flex flex-col gap-4">
             <Button onClick={handleUpdate} className="w-full h-16 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] bg-primary text-white shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all">
               Commit Preferences
             </Button>

             <AlertDialog>
               <AlertDialogTrigger asChild>
                 <Button variant="ghost" className="w-full h-12 text-destructive font-black uppercase text-[9px] tracking-widest hover:bg-destructive/5 gap-2 group">
                   <Trash2 className="w-3.5 h-3.5 group-hover:shake transition-transform" />
                   Delete My Account Permanently
                 </Button>
               </AlertDialogTrigger>
               <AlertDialogContent className="max-w-md rounded-[2.5rem] p-10 border-none shadow-4xl bg-white dark:bg-zinc-950">
                 <AlertDialogHeader className="space-y-4">
                    <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/20 rounded-2xl flex items-center justify-center text-rose-600 mx-auto md:mx-0 shadow-inner">
                      <AlertTriangle className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <AlertDialogTitle className="text-2xl font-black font-headline uppercase tracking-tighter">
                        Delete <span className="text-rose-600 italic">Account?</span>
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-sm font-medium leading-relaxed italic text-muted-foreground">
                        "This action cannot be undone. Your profile, order history, saved addresses, and personal data will be permanently removed from the EzzyBites ecosystem."
                      </AlertDialogDescription>
                    </div>
                 </AlertDialogHeader>
                 <AlertDialogFooter className="mt-8 flex flex-col sm:flex-row gap-3">
                   <AlertDialogCancel className="h-14 flex-1 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2">
                     <ChevronLeft className="w-4 h-4 mr-2" /> Back
                   </AlertDialogCancel>
                   <AlertDialogAction 
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteAccount();
                    }}
                    disabled={isDeleting}
                    className="h-14 flex-[2] rounded-2xl font-black uppercase text-[10px] tracking-widest bg-rose-600 text-white shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all gap-2"
                   >
                     {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                     Delete Permanently
                   </AlertDialogAction>
                 </AlertDialogFooter>
               </AlertDialogContent>
             </AlertDialog>
          </div>
          
          <div className="text-center pt-8">
             <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-20">Ezzy Bites • Configuration Cluster v4.2</p>
          </div>
        </div>
      </main>
    </div>
  );
}
