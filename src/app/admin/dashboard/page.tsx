'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { AdminSection } from '@/components/AdminSection';
import { Button } from '@/components/ui/button';
import { ShoppingBag, LogOut, Loader2, ShieldCheck, UserCog, ChefHat, Receipt, Moon, Sun } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';

export type StaffRole = 'admin' | 'cashier' | 'kitchen';

function DashboardContent() {
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [assignedRole, setAssignedRole] = useState<StaffRole | null>(null);
  const [activeView, setActiveView] = useState<StaffRole | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  const PRIMARY_ADMIN_EMAIL = "sunnyritheesh@gmail.com";

  const requestedView = searchParams.get('view') as StaffRole;

  useEffect(() => {
    async function checkRole() {
      if (userLoading) return;

      if (!user) {
        router.push('/admin/login');
        return;
      }

      if (!db || !auth) return;

      if (user.email === PRIMARY_ADMIN_EMAIL) {
        setAssignedRole('admin');
        if (['admin', 'cashier', 'kitchen'].includes(requestedView)) {
          setActiveView(requestedView);
        } else {
          setActiveView('admin');
        }
        setCheckingRole(false);
        return;
      }

      try {
        const adminRef = doc(db, 'admins', user.uid);
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists()) {
          const data = adminSnap.data();
          const role = (data.role as StaffRole) || 'cashier';
          
          if (data.status === 'disabled') {
            toast({ variant: "destructive", title: "Access Revoked", description: "Account disabled." });
            await auth.signOut();
            router.push('/admin/login');
            return;
          }

          setAssignedRole(role);
          setActiveView(role);
          setCheckingRole(false);
        } else {
          toast({
            variant: "destructive",
            title: "Access Restricted",
            description: "Staff record not found.",
          });
          await auth.signOut();
          router.push('/admin/login');
        }
      } catch (e: any) {
        console.error("Dashboard role error:", e);
        setCheckingRole(false);
      }
    }

    checkRole();
  }, [user, userLoading, db, router, auth, requestedView]);

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
      toast({ title: "Session Closed" });
      router.push('/admin/login');
    }
  };

  const switchView = (role: StaffRole) => {
    if (assignedRole !== 'admin') return;
    router.push(`/admin/dashboard?view=${role}`);
    setActiveView(role);
  };

  if (userLoading || checkingRole || !activeView) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mb-8">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black uppercase tracking-tight">Syncing Hub</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Establishing Identity...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      {/* FIXED TOP HEADER - 70px - Z-100 */}
      <header className="h-[70px] border-b bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-[100] px-4 md:px-8 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-all shadow-lg shadow-primary/20">
              <ShoppingBag className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-headline font-black tracking-tighter leading-none uppercase">Ezzy<span className="text-primary italic">Ops</span></span>
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Command Center</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-2 ml-4">
            <Badge variant="outline" className="px-3 py-1 rounded-full border-primary/20 bg-primary/5 text-primary font-black uppercase text-[8px] tracking-widest gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {assignedRole} NODE
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle className="h-9 w-9 bg-secondary/50 border-none" />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="rounded-xl h-11 px-3 md:px-4 gap-3 hover:bg-secondary/80 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <UserCog className="w-4 h-4" />
                </div>
                <div className="hidden md:flex flex-col items-start text-left mr-2">
                   <p className="text-[10px] font-black uppercase tracking-tight leading-none mb-1">Identity</p>
                   <p className="text-[9px] font-bold opacity-50 truncate max-w-[100px]">{user?.email?.split('@')[0]}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-[2rem] p-3 shadow-3xl border-none mt-2 bg-white dark:bg-zinc-950">
              <DropdownMenuLabel className="text-[9px] font-black uppercase opacity-40 px-3 py-2">Staff Terminal</DropdownMenuLabel>
              <div className="px-3 py-3 bg-secondary/30 rounded-2xl mb-2">
                <p className="text-xs font-black truncate">{user?.email}</p>
                <p className="text-[8px] font-bold opacity-50 uppercase tracking-widest mt-1">Status: Operational</p>
              </div>
              
              {assignedRole === 'admin' && (
                <>
                  <DropdownMenuSeparator className="opacity-10" />
                  <DropdownMenuLabel className="text-[9px] font-black uppercase opacity-40 px-3 py-2">Switch Logic</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => switchView('admin')} className="rounded-xl gap-3 py-3 font-bold cursor-pointer hover:bg-primary/5 transition-all"><ShieldCheck className="w-4 h-4 text-primary" /> Administrator</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => switchView('cashier')} className="rounded-xl gap-3 py-3 font-bold cursor-pointer hover:bg-primary/5 transition-all"><Receipt className="w-4 h-4 text-blue-500" /> POS Cashier</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => switchView('kitchen')} className="rounded-xl gap-3 py-3 font-bold cursor-pointer hover:bg-primary/5 transition-all"><ChefHat className="w-4 h-4 text-orange-500" /> Kitchen Station</DropdownMenuItem>
                </>
              )}
              
              <DropdownMenuSeparator className="opacity-10" />
              <DropdownMenuItem onClick={handleLogout} className="rounded-xl gap-3 py-3 font-bold text-destructive cursor-pointer hover:bg-destructive/5 transition-all">
                <LogOut className="w-4 h-4" /> Terminate Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* DASHBOARD BODY - NO EXTRA MARGIN */}
      <AdminSection assignedRole={assignedRole as StaffRole} activeView={activeView as StaffRole} />
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
