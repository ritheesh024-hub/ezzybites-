'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { AdminSection } from '@/components/AdminSection';
import { Button } from '@/components/ui/button';
import { ShoppingBag, LogOut, Loader2, ShieldCheck, UserCog, ChefHat, Receipt } from 'lucide-react';
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

  // Get requested view from URL if present
  const requestedView = searchParams.get('view') as StaffRole;

  useEffect(() => {
    async function checkRole() {
      if (userLoading) return;

      if (!user) {
        router.push('/admin/login');
        return;
      }

      if (!db || !auth) return;

      try {
        const adminRef = doc(db, 'admins', user.uid);
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists()) {
          const data = adminSnap.data();
          const role = (data.role as StaffRole) || 'cashier';
          
          // Force admin role if email matches primary
          const effectiveRole = user.email === PRIMARY_ADMIN_EMAIL ? 'admin' : role;
          setAssignedRole(effectiveRole);
          
          if (effectiveRole === 'admin' && ['admin', 'cashier', 'kitchen'].includes(requestedView)) {
            setActiveView(requestedView);
          } else {
            setActiveView(effectiveRole);
          }
          
          setCheckingRole(false);
        } else if (user.email === PRIMARY_ADMIN_EMAIL) {
          // Fallback for primary admin if record was momentarily missing
          setAssignedRole('admin');
          setActiveView('admin');
          setCheckingRole(false);
        } else {
          toast({
            variant: "destructive",
            title: "Access Restricted",
            description: "Staff credentials not found. Please sign in via the hub.",
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
      toast({ title: "Session Closed", description: "Logged out successfully." });
      router.push('/admin/login');
    }
  };

  const switchView = (role: StaffRole) => {
    if (assignedRole !== 'admin') return;
    router.push(`/admin/dashboard?view=${role}`);
    setActiveView(role);
    toast({ title: `View switched to ${role.toUpperCase()}` });
  };

  if (userLoading || checkingRole || !activeView) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mb-8">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black uppercase tracking-tight">Syncing Identity</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Establishing Secure Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-white dark:bg-zinc-900 sticky top-0 z-[60] h-20">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-all shadow-lg shadow-primary/20">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-headline font-black tracking-tight leading-none">Ezzy<span className="text-primary italic">Ops</span></span>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Staff Control</span>
              </div>
            </Link>

            <div className="hidden sm:flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1 rounded-full border-primary/20 bg-primary/5 text-primary font-black uppercase text-[9px] tracking-widest">
                <ShieldCheck className="w-3 h-3" /> {assignedRole}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-xl h-12 px-6 gap-2 font-black uppercase text-[10px] tracking-widest border-2">
                  <UserCog className="w-4 h-4" /> Account
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 shadow-3xl">
                <DropdownMenuLabel className="text-[9px] font-black uppercase opacity-40 px-2 py-1.5">Staff Identity</DropdownMenuLabel>
                <div className="px-2 py-3 bg-secondary/30 rounded-xl mb-2">
                  <p className="text-xs font-black truncate">{user?.email}</p>
                </div>
                
                {assignedRole === 'admin' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[9px] font-black uppercase opacity-40 px-2 py-1.5">Switch Mode</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => switchView('admin')} className="rounded-xl gap-3 py-3 font-bold"><ShieldCheck className="w-4 h-4 text-primary" /> Admin View</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => switchView('cashier')} className="rounded-xl gap-3 py-3 font-bold"><Receipt className="w-4 h-4 text-blue-500" /> Cashier View</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => switchView('kitchen')} className="rounded-xl gap-3 py-3 font-bold"><ChefHat className="w-4 h-4 text-orange-500" /> Kitchen View</DropdownMenuItem>
                  </>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="rounded-xl gap-3 py-3 font-bold text-destructive">
                  <LogOut className="w-4 h-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <main className="animate-in fade-in slide-in-from-bottom-2 duration-700">
        <AdminSection assignedRole={assignedRole as StaffRole} activeView={activeView as StaffRole} />
      </main>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
