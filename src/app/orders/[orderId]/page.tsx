"use client"
import React, { useMemo, useState, useEffect, use } from 'react';
import { Navbar } from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, MapPin, Phone, MessageSquare, 
  Truck, ChefHat, PackageCheck, Loader2, 
  AlertCircle, Ban, Clock, ShoppingBag,
  ArrowLeft, Info, HelpCircle, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useFirestore, useDoc, useUser } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/use-analytics';
import { motion, AnimatePresence } from 'framer-motion';
import { ReviewForm } from '@/components/ReviewForm';

export default function OrderTrackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { trackOrderCancelled } = useAnalytics();

  const orderRef = useMemo(() => {
    if (!db || !orderId) return null;
    return doc(db, 'orders', orderId);
  }, [db, orderId]);

  const { data: order, loading, error } = useDoc<any>(orderRef);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [canCancel, setCanCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  useEffect(() => {
    if (!order?.createdAt || (order.status !== 'pending' && order.status !== 'accepted')) {
      setCanCancel(false);
      return;
    }

    const createdAt = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
    const expiryTime = createdAt.getTime() + 5 * 60 * 1000;

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = expiryTime - now;

      if (difference <= 0) {
        setTimeLeft(0);
        setCanCancel(false);
        return false;
      }

      setTimeLeft(Math.floor(difference / 1000));
      setCanCancel(true);
      return true;
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [order?.createdAt, order?.status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCancelOrder = async () => {
    if (!db || !order || !canCancel || !user) return;
    setCancelling(true);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'Cancelled',
        cancelledAt: serverTimestamp(),
        cancelledBy: 'Customer',
        updatedAt: serverTimestamp()
      });
      trackOrderCancelled(orderId);
      toast({ title: "Order Cancelled", description: "Your order has been revoked as requested." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Cancellation Failed", description: "The window might have closed. Contact support." });
    } finally {
      setCancelling(false);
    }
  };

  const statusMap: Record<string, number> = {
    'pending': 1,
    'accepted': 2,
    'preparing': 3,
    'out_for_delivery': 4,
    'delivered': 5,
    'Cancelled': 0
  };

  const statusLevel = order ? statusMap[order.status] || 1 : 1;

  const steps = [
    { id: 1, title: 'Order Placed', statusKey: 'pending', icon: PackageCheck, desc: 'We have received your request.' },
    { id: 2, title: 'Confirmed', statusKey: 'accepted', icon: CheckCircle2, desc: 'Kitchen is reviewing your items.' },
    { id: 3, title: 'Preparing Food', statusKey: 'preparing', icon: ChefHat, desc: 'Our chefs are crafting your meal.' },
    { id: 4, title: 'Out for Delivery', statusKey: 'out_for_delivery', icon: Truck, desc: 'Our rider is heading to your sanctuary.' },
    { id: 5, title: 'Delivered', statusKey: 'delivered', icon: CheckCircle2, desc: 'Bites received. Enjoy your meal!' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-6" />
        <p className="font-black uppercase tracking-[0.3em] text-[10px] text-muted-foreground animate-pulse">Syncing Live Status...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-destructive mb-6" />
        <h2 className="text-2xl font-black uppercase tracking-tighter">Order Not Found</h2>
        <p className="text-muted-foreground mt-2 mb-8 text-sm">We couldn't locate this order in our live registry.</p>
        <Link href="/">
          <Button className="rounded-full px-10 h-14 font-black uppercase text-[10px] tracking-widest bg-primary">Back to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/5 pb-20">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-2">
               <Link href="/orders">
                 <button className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                   <ArrowLeft className="w-4 h-4" />
                 </button>
               </Link>
               <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-full font-black uppercase text-[9px] tracking-widest">
                #{order.orderId}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-5xl font-black font-headline uppercase tracking-tighter">Live <span className="text-primary italic">Tracking.</span></h1>
            <p className="text-xs font-bold text-muted-foreground flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> 
              Placed on {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString([], { hour: '2-digit', minute: '2-digit', hour12: true, day: 'numeric', month: 'short' }) : 'Syncing...'}
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
             {order.status === 'delivered' && !order.isReviewed && (
                <Button onClick={() => setIsReviewOpen(true)} className="flex-1 md:flex-none rounded-full h-14 px-8 gap-2 font-black uppercase text-[10px] tracking-widest bg-orange-gradient shadow-xl shadow-primary/20">
                   <Star className="w-4 h-4 fill-current" /> Rate items
                </Button>
             )}
             <Button variant="outline" className="flex-1 md:flex-none rounded-full h-14 px-8 gap-2 font-black uppercase text-[10px] tracking-widest border-2" onClick={() => window.open('tel:8639366800')}>
                <Phone className="w-4 h-4" /> Call Station
             </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <AnimatePresence>
              {canCancel && order.status !== 'Cancelled' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card className="rounded-[2.5rem] border-none shadow-xl bg-orange-50 overflow-hidden">
                    <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center shrink-0 text-orange-600">
                          <Clock className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="font-black uppercase text-[10px] tracking-widest mb-1">Safety Window Active</h4>
                          <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                            You can revoke this order for the next <span className="text-orange-600 font-bold">{formatTime(timeLeft || 0)}</span>.
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={handleCancelOrder} 
                        disabled={cancelling}
                        variant="destructive" 
                        className="rounded-xl h-11 px-8 font-black uppercase text-[9px] tracking-widest shadow-lg shadow-destructive/20 w-full md:w-auto"
                      >
                        {cancelling ? <Loader2 className="animate-spin" /> : 'Cancel Order'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <Card className="rounded-[3rem] border-none shadow-2xl overflow-hidden bg-white dark:bg-zinc-900">
              <CardContent className="p-8 md:p-12">
                {order.status === 'Cancelled' ? (
                  <div className="text-center py-12 space-y-6">
                    <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <Ban className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-3xl font-black font-headline uppercase tracking-tighter">Order <span className="text-rose-500 italic">Revoked</span></h4>
                      <p className="text-muted-foreground text-sm font-medium">This transaction has been terminated from the hub.</p>
                    </div>
                    {order.cancelledAt && (
                      <p className="text-[9px] font-black uppercase opacity-40 tracking-widest pt-4">
                        Timestamp: {order.cancelledAt.toDate ? order.cancelledAt.toDate().toLocaleString() : 'Recent'}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="relative space-y-10">
                    <div className="absolute left-6 top-6 w-0.5 h-[calc(100%-48px)] bg-muted/40 z-0" />
                    {steps.map((step, idx) => {
                      const Icon = step.icon;
                      const isActive = statusLevel >= step.id;
                      const isCurrent = statusLevel === step.id;

                      return (
                        <div key={idx} className={cn(
                          "relative z-10 flex gap-6 md:gap-10 items-start transition-all duration-700",
                          isActive ? 'opacity-100' : 'opacity-20 grayscale'
                        )}>
                          <div className={cn(
                            "w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all shrink-0 border-4 border-white dark:border-zinc-900",
                            isCurrent ? 'bg-orange-500 text-white scale-110' : isActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                          )}>
                            {isActive && !isCurrent ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                          </div>
                          <div className="flex-1 pt-1">
                            <h4 className={cn(
                              "text-lg md:text-2xl font-black uppercase tracking-tight leading-none",
                              isCurrent ? 'text-orange-600' : isActive ? 'text-foreground' : 'text-muted-foreground'
                            )}>{step.title}</h4>
                            <p className="text-xs md:text-sm font-medium text-muted-foreground mt-1">{step.desc}</p>
                            {isCurrent && (
                              <div className="mt-4 flex gap-2 items-center bg-orange-500/10 w-fit px-3 py-1 rounded-full border border-orange-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-orange-600">LIVE NOW</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-8">
              <CardContent className="p-0 space-y-8">
                <div className="flex items-center gap-3 border-b border-dashed pb-6">
                   <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-primary"><ShoppingBag className="w-5 h-5" /></div>
                   <h4 className="font-black text-xs uppercase tracking-[0.3em] text-muted-foreground">Order Manifest</h4>
                </div>
                <div className="space-y-6">
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex flex-col gap-3 pb-6 border-b border-zinc-50 dark:border-zinc-800 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-secondary/50 rounded-xl flex items-center justify-center font-black text-sm text-primary">x{item.quantity}</div>
                          <span className="font-black text-base uppercase tracking-tight">{item.name}</span>
                        </div>
                        <span className="font-black text-lg italic">₹{item.price * item.quantity}</span>
                      </div>
                      {item.customization && (
                        <div className="flex flex-wrap items-center gap-2 pl-14">
                           <Badge variant="outline" className="text-[7px] font-black uppercase bg-secondary/30">{item.customization.size}</Badge>
                           <Badge variant="outline" className="text-[7px] font-black uppercase">{item.customization.temp}</Badge>
                           <Badge variant="outline" className="text-[7px] font-black uppercase">Sugar: {item.customization.sugar}</Badge>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="pt-6 flex justify-between items-end">
                    <span className="font-black text-xs uppercase tracking-widest opacity-40 mb-1">Final Settlement</span>
                    <span className="text-4xl md:text-6xl font-black text-primary italic leading-none">₹{order.total}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-zinc-900 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10"><Truck className="w-32 h-32 rotate-12" /></div>
              <CardContent className="p-8 space-y-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <MapPin className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Delivery Sanctuary</p>
                    <h4 className="text-xl font-black uppercase tracking-tighter leading-tight">Your Destination</h4>
                  </div>
                </div>
                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                  <p className="text-sm font-medium leading-relaxed italic text-white/80">"{order.address}"</p>
                  {order.instructions && (
                    <div className="pt-4 border-t border-white/5 flex gap-3">
                       <Info className="w-4 h-4 text-primary shrink-0" />
                       <p className="text-[10px] font-bold text-white/40 uppercase">Note: {order.instructions}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <Button className="w-full bg-primary text-white hover:bg-primary/90 rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest gap-3 shadow-xl" onClick={() => window.open('https://wa.me/918639366800')}>
                    <MessageSquare className="w-4 h-4" /> Live Chat Support
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-8">
               <CardContent className="p-0 space-y-6">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    <h4 className="text-xs font-black uppercase tracking-widest">Need Assistance?</h4>
                  </div>
                  <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                    Our hub is monitoring this ticket in real-time. If you face any issues with quality or logistics, reach out to our fleet commander instantly.
                  </p>
                  <Link href="/menu">
                    <Button variant="ghost" className="w-full justify-start px-0 text-primary font-black uppercase text-[9px] tracking-widest hover:bg-transparent hover:translate-x-1 transition-transform">
                      Continue Selecting Bites <ArrowLeft className="w-3 h-3 ml-2 rotate-180" />
                    </Button>
                  </Link>
               </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <ReviewForm 
        order={order} 
        isOpen={isReviewOpen} 
        onClose={() => setIsReviewOpen(false)} 
        onSuccess={() => {}}
      />
    </div>
  );
}
