
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { AdminSection } from '@/components/AdminSection';
import { Button } from '@/components/ui/button';
import { ShoppingBag, LogOut, Loader2, ShieldCheck, UserCog, ChefHat, Receipt, ArrowLeft } from 'lucide-react';
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

export default function AdminDashboardPage() {
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  
  const [assignedRole, setAssignedRole] = useState<StaffRole | null>(null);
  const [activeView, setActiveView] = useState<StaffRole | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    async function checkRole() {
      if (!userLoading) {
        if (!user) {
          router.push('/admin/login');
          return;
        }

        if (db) {
          try {
            const adminRef = doc(db, 'admins', user.uid);
            const adminSnap = await getDoc(adminRef);

            if (adminSnap.exists()) {
              const data = adminSnap.data();
              const role = (data.role as StaffRole) || 'cashier';
              setAssignedRole(role);
              setActiveView(role);
              setCheckingRole(false);
            } else {
              // Not an authorized staff member in Firestore
              toast({
                variant: "destructive",
                title: "Unauthorized",
                description: "Your account is not registered in our staff directory.",
              });
              await auth?.signOut();
              router.push('/admin/login');
            }
          } catch (e) {
            console.error("Error checking role:", e);
            setCheckingRole(false);
          }
        }
      }
    }

    checkRole();
  }, [user, userLoading, db, router, auth]);

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
      toast({ title: "Logged out", description: "Operational session ended." });
      router.push('/admin/login');
    }
  };

  const switchView = (role: StaffRole) => {
    if (assignedRole !== 'admin') {
      toast({ variant: "destructive", title: "Restricted", description: "Only Admins can override views." });
      return;
    }
    setActiveView(role);
    toast({ title: `Operational View: ${role.toUpperCase()}` });
  };

  if (userLoading || checkingRole || !activeView) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mb-8">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Establishing Secure Session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-white dark:bg-zinc-900 sticky top-0 z-[60]">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-all shadow-lg shadow-primary/20">
                <ShoppingBag className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-headline font-black tracking-tight leading-none">
                  Ezzy<span className="text-primary italic">Ops</span>
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Operational Console</span>
              </div>
            </Link>

            <div className="hidden sm:flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1 rounded-full border-primary/20 bg-primary/5 text-primary font-black uppercase text-[9px] tracking-widest">
                <ShieldCheck className="w-3 h-3" />
                {assignedRole}
              </Badge>
              {activeView !== assignedRole && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 font-black uppercase text-[8px] px-2 rounded-full">
                  Viewing as {activeView}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="hidden md:flex rounded-xl gap-2 font-black uppercase text-[9px] tracking-widest">
                <ArrowLeft className="w-3.5 h-3.5" /> Site Home
              </Button>
            </Link>

            {assignedRole === 'admin' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-xl h-12 px-6 gap-2 font-black uppercase text-[10px] tracking-widest border-2">
                    <UserCog className="w-4 h-4" />
                    Switch View
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
                  <DropdownMenuLabel className="text-[9px] font-black uppercase opacity-40 px-2 py-1.5">Operational Overrides</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => switchView('admin')} className="rounded-xl gap-3 py-3 font-bold">
                    <ShieldCheck className="w-4 h-4 text-primary" /> Admin View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => switchView('cashier')} className="rounded-xl gap-3 py-3 font-bold">
                    <Receipt className="w-4 h-4 text-blue-500" /> Cashier View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => switchView('kitchen')} className="rounded-xl gap-3 py-3 font-bold">
                    <ChefHat className="w-4 h-4 text-orange-500" /> Kitchen View
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-xl h-12 w-12 hover:bg-destructive/10 hover:text-destructive transition-all" 
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="animate-in fade-in slide-in-from-bottom-2 duration-700">
        <AdminSection assignedRole={assignedRole as StaffRole} activeView={activeView as StaffRole} />
      </main>
    </div>
  );
}
