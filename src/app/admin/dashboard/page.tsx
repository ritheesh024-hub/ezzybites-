
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { AdminSection } from '@/components/AdminSection';
import { Button } from '@/components/ui/button';
import { ShoppingBag, LogOut, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.push('/admin/login');
      } else {
        // In a real app, check for an 'admin' flag in Firestore or custom claims
        // For this MVP, we assume any authenticated user on this route is admin
        setIsAuthorized(true);
      }
    }
  }, [user, userLoading, router]);

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
      router.push('/admin/login');
    }
  };

  if (userLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-headline font-bold">
              Easy<span className="text-primary">Bites</span> <span className="text-muted-foreground font-normal text-sm ml-2">Admin</span>
            </span>
          </Link>
          <Button variant="ghost" className="rounded-full gap-2" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </nav>

      <main>
        <AdminSection />
      </main>
    </div>
  );
}
