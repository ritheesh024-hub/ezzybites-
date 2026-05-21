
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { AdminSection } from '@/components/AdminSection';
import { Button } from '@/components/ui/button';
import { ShoppingBag, LogOut, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

const ADMIN_EMAIL = 'sunnyritheesh@gmail.com';

export default function AdminDashboardPage() {
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.push('/admin/login');
      } else if (user.email !== ADMIN_EMAIL) {
        // Force logout if logged in with wrong account
        auth.signOut().then(() => {
          toast({
            variant: "destructive",
            title: "Unauthorized Access",
            description: "This portal is restricted to authorized administrators only.",
          });
          router.push('/admin/login');
        });
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, userLoading, router, auth]);

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
      router.push('/admin/login');
    }
  };

  if (userLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-headline font-bold">
              Ezzy<span className="text-primary">Bites</span> <span className="text-muted-foreground font-normal text-sm ml-2 hidden sm:inline">Admin</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-bold text-foreground">Logged in as</span>
              <span className="text-[10px] text-muted-foreground">{user?.email}</span>
            </div>
            <Button variant="outline" size="sm" className="rounded-full gap-2 hover:bg-destructive hover:text-destructive-foreground transition-all" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="animate-in fade-in duration-700">
        <AdminSection />
      </main>
    </div>
  );
}
