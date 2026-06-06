"use client"
import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, ChevronRight, Clock, Loader2, PackageX, History, User, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AuthModal } from '@/components/AuthModal';

export default function OrdersHistoryPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const db = useFirestore();
  const { user, loading: userLoading } = useUser();

  const ordersQuery = useMemo(() => {
    if (!db) return null;
    if (user) {
      return query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        limit(100)
      );
    }
    if (searchTriggered && phoneNumber.length === 10) {
      return query(
        collection(db, 'orders'),
        where('customerPhone', '==', phoneNumber),
        limit(50)
      );
    }
    return null;
  }, [db, user, phoneNumber, searchTriggered]);

  const { data: rawOrders, loading: ordersLoading, error } = useCollection<any>(ordersQuery);

  const orders = useMemo(() => {
    if (!rawOrders) return [];
    return [...rawOrders].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [rawOrders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length === 10) {
      setSearchTriggered(true);
    }
  };

  const loading = userLoading || ordersLoading;

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-zinc-950 pb-12">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 md:pt-32">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mx-auto shadow-soft">
              <History className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tighter">My <span className="text-primary italic">Orders</span></h1>
            <p className="text-muted-foreground font-medium">
              {user ? `Welcome back, ${user.displayName?.split(' ')[0]}!` : 'Sign in to see your history.'}
            </p>
          </div>

          {!user && (
            <Card className="rounded-[2.5rem] border-none shadow-3xl p-8 md:p-12 bg-white dark:bg-zinc-900">
              <div className="space-y-8">
                <Button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full h-16 rounded-2xl font-black text-lg bg-orange-gradient gap-3 shadow-2xl shadow-primary/20"
                >
                  <User className="w-5 h-5" /> Sign In for History
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-dashed" /></div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-white dark:bg-zinc-900 px-4 font-black opacity-30">Or search guest orders</span></div>
                </div>

                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r pr-4">
                      <span className="text-xs font-black">+91</span>
                    </div>
                    <Input 
                      type="tel"
                      value={phoneNumber} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhoneNumber(val);
                        setSearchTriggered(false);
                      }} 
                      className="h-16 pl-24 rounded-2xl font-black text-lg bg-secondary/50 border-none" 
                      placeholder="00000 00000"
                    />
                  </div>
                  <Button type="submit" disabled={phoneNumber.length < 10} className="h-16 rounded-2xl px-10 font-black text-lg bg-primary text-white">
                    Find Orders
                  </Button>
                </form>
              </div>
            </Card>
          )}

          <div className="space-y-6">
            {loading ? (
              <div className="py-20 text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                <p className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Searching your tray history...</p>
              </div>
            ) : error ? (
              <div className="py-20 text-center space-y-4 bg-destructive/5 rounded-[2.5rem] border-2 border-dashed border-destructive/20 p-10">
                <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
                <h3 className="text-2xl font-black text-destructive uppercase tracking-tighter">Sync Interrupted</h3>
                <p className="text-sm font-medium text-muted-foreground">We couldn't retrieve your orders. Please try again.</p>
              </div>
            ) : (user || searchTriggered) ? (
              orders && orders.length > 0 ? (
                orders.map((order: any) => (
                  <Link key={order.id} href={`/orders/${order.orderId}`}>
                    <Card className="rounded-[2.5rem] border-none shadow-soft hover:shadow-2xl transition-all mb-6 group bg-white dark:bg-zinc-900 overflow-hidden">
                      <CardContent className="p-8 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-6 w-full md:w-auto">
                          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                            <ShoppingBag className="w-8 h-8" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-black text-xl tracking-tight">#{order.orderId}</h4>
                              <Badge className={cn(
                                "text-[9px] uppercase font-black px-3 py-1 rounded-lg border-none shadow-sm",
                                order.status === 'Delivered' ? 'bg-green-500 text-white' : 
                                order.status === 'Cancelled' ? 'bg-red-500 text-white' : 
                                'bg-orange-500 text-white'
                              )}>
                                {order.status}
                              </Badge>
                            </div>
                            <p className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                              <Clock className="w-4 h-4" /> 
                              {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Processing'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between w-full md:w-auto gap-10">
                          <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Final Amount</p>
                            <p className="text-3xl font-black text-primary italic">₹{order.total}</p>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-secondary dark:bg-zinc-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                            <ChevronRight className="w-6 h-6" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              ) : (
                <div className="py-24 text-center space-y-8">
                  <div className="w-24 h-24 bg-secondary dark:bg-zinc-800 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                    <PackageX className="w-12 h-12 text-muted-foreground opacity-20" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black mb-2 uppercase tracking-tighter">Tray is <span className="text-primary italic">Empty</span></h3>
                    <p className="text-muted-foreground font-medium">You haven't placed any orders yet. Let's change that!</p>
                  </div>
                  <Link href="/menu">
                    <Button className="rounded-2xl h-16 px-10 font-black uppercase text-[10px] tracking-[0.2em] bg-orange-gradient">Browse Menu</Button>
                  </Link>
                </div>
              )
            ) : null}
          </div>
        </div>
      </main>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}