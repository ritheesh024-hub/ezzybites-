"use client"
import React, { useMemo, useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useParams, useRouter } from 'next/navigation';
import { 
  CheckCircle2, MapPin, Phone, MessageSquare, 
  Truck, ChefHat, PackageCheck, Loader2, 
  AlertCircle, Settings2, Ban, Clock 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { useFirestore, useDoc, useUser } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();

  const orderRef = useMemo(() => {
    if (!db || !orderId) return null;
    return doc(db, 'orders', orderId);
  }, [db, orderId]);

  const { data: order, loading, error } = useDoc<any>(orderRef);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [canCancel, setCanCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Cancellation Timer Logic (Production Grade)
  useEffect(() => {
    if (!order?.createdAt || (order.status !== 'Pending' && order.status !== 'Confirmed')) {
      setCanCancel(false);
      return;
    }

    // Handle both Firestore timestamp and JS Date
    const createdAt = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
    const expiryTime = createdAt.getTime() + 5 * 60 * 1000; // 5 minute window

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
    if (order.userId !== user.uid) {
      toast({ variant: "destructive", title: "Action Denied", description: "You can only cancel your own orders." });
      return;
    }

    setCancelling(true);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'Cancelled',
        cancelledAt: serverTimestamp(),
        cancelledBy: 'Customer'
      });
      toast({ title: "Order Cancelled Successfully 🚀" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Cancellation Failed", description: e.message });
    } finally {
      setCancelling(false);
    }
  };

  const statusMap: Record<string, number> = {
    'Pending': 1,
    'Confirmed': 2,
    'Preparing': 3,
    'Out for Delivery': 4,
    'Delivered': 5,
    'Cancelled': 0
  };

  const statusLevel = order ? statusMap[order.status] || 1 : 1;

  const steps = [
    { id: 1, title: 'Order Placed', icon: PackageCheck, desc: 'We have received your order.' },
    { id: 2, title: 'Accepted', icon: CheckCircle2, desc: 'Your order has been accepted by the kitchen.' },
    { id: 3, title: 'Preparing Food', icon: ChefHat, desc: 'Our chef is crafting your gourmet meal.' },
    { id: 4, title: 'Out for Delivery', icon: Truck, desc: 'Our delivery partner is on the way.' },
    { id: 5, title: 'Delivered', icon: CheckCircle2, desc: 'Order received. Enjoy your bites!' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="relative mb-8">
           <div className="w-24 h-24 bg-primary/10 rounded-[3rem] animate-pulse" />
           <Loader2 className="w-10 h-10 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="font-black uppercase tracking-[0.3em] text-[10px] text-muted-foreground animate-pulse">Establishing Live Tracking...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
           <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter">Order Not Found</h2>
        <p className="text-muted-foreground mt-2 mb-10 max-w-xs">We couldn't locate an order with ID: <span className="font-mono text-primary font-bold">{orderId}</span></p>
        <Link href="/">
          <Button className="rounded-full px-12 h-14 font-black uppercase text-[10px] tracking-widest bg-primary">Back to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10 pb-12 overflow-x-hidden">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl pt-24 md:pt-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="space-y-1">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-2 px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[9px]">
              Live Feed • {order.orderType || 'Online'}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-headline font-black uppercase tracking-tighter">ID: <span className="text-primary italic">#{order.orderId}</span></h1>
            <p className="text-xs font-bold text-muted-foreground flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> 
              Placed on {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : 'Just now'}
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none rounded-full h-14 px-8 gap-2 font-black uppercase text-[10px] tracking-widest border-2" onClick={() => window.open('https://wa.me/918639366800', '_blank')}>
              <MessageSquare className="w-4 h-4" /> Chat Support
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Cancellation Safety Window */}
            {(order.status === 'Pending' || order.status === 'Confirmed') && (
              <Card className={cn(
                "rounded-[2.5rem] border-none shadow-xl overflow-hidden transition-all duration-500",
                canCancel ? "bg-orange-50 border-orange-100" : "bg-zinc-50/50 opacity-80"
              )}>
                <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                      canCancel ? "bg-orange-100 text-orange-600" : "bg-zinc-200 text-zinc-400"
                    )}>
                      <Ban className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black uppercase text-[10px] tracking-widest mb-1">Safety Cancellation Window</h4>
                      <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                        {canCancel 
                          ? "You can revoke this order within the next few minutes if needed." 
                          : "The safety window has expired. Our kitchen is now processing your ingredients."}
                      </p>
                    </div>
                  </div>
                  
                  {canCancel ? (
                    <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
                      <div className="flex items-center gap-2 text-orange-600 font-black text-sm bg-white px-4 py-2 rounded-xl shadow-sm border border-orange-100">
                        <Clock className="w-4 h-4 animate-spin-slow" />
                        {timeLeft !== null && formatTime(timeLeft)}
                      </div>
                      <Button 
                        onClick={handleCancelOrder} 
                        disabled={cancelling}
                        variant="destructive" 
                        className="rounded-xl h-11 px-8 font-black uppercase text-[9px] tracking-widest shadow-lg shadow-destructive/20 w-full md:w-auto"
                      >
                        {cancelling ? <Loader2 className="animate-spin" /> : 'Cancel Order'}
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase opacity-60 bg-zinc-200">
                      Window Closed
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="rounded-[3rem] border-none shadow-2xl overflow-hidden bg-white dark:bg-zinc-900">
              <CardContent className="p-8 md:p-12">
                {order.status === 'Cancelled' ? (
                   <div className="text-center py-12">
                      <div className="w-24 h-24 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <Ban className="w-10 h-10" />
                      </div>
                      <h4 className="text-3xl font-black font-headline uppercase tracking-tighter mb-2">Order <span className="text-destructive italic">Revoked</span></h4>
                      <p className="text-muted-foreground font-medium text-sm">
                        {order.cancelledBy === 'Customer' 
                          ? "This order was cancelled from your dashboard." 
                          : "This order was declined by our operational team."}
                      </p>
                      {order.cancelledAt && (
                        <div className="mt-8 pt-8 border-t border-dashed">
                           <p className="text-[9px] font-black uppercase opacity-40 tracking-widest">
                             Timestamp: {order.cancelledAt.toDate ? order.cancelledAt.toDate().toLocaleString() : new Date(order.cancelledAt).toLocaleString()}
                           </p>
                        </div>
                      )}
                   </div>
                ) : (
                  <div className="relative space-y-12">
                    <div className="absolute left-6 top-6 w-1 h-[calc(100%-48px)] bg-muted/40 z-0" />
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
                            isActive ? 'bg-primary text-white scale-110 shadow-primary/30' : 'bg-muted text-muted-foreground'
                          )}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1 pt-1">
                            <h4 className={cn(
                              "text-lg md:text-2xl font-black uppercase tracking-tight leading-none",
                              isActive ? 'text-foreground' : 'text-muted-foreground'
                            )}>{step.title}</h4>
                            <p className="text-xs md:text-sm font-medium text-muted-foreground mt-1">{step.desc}</p>
                            {isCurrent && (
                              <div className="mt-4 flex gap-3 items-center bg-primary/5 w-fit px-3 py-1.5 rounded-full border border-primary/10">
                                <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary">Active Status</span>
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

            <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900">
              <CardContent className="p-8">
                <h4 className="font-black text-xs uppercase tracking-[0.3em] text-muted-foreground mb-8">Manifest Breakdown</h4>
                <div className="space-y-6">
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex flex-col gap-2 border-b border-dashed border-muted pb-6 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center font-black text-sm text-primary">x{item.quantity}</div>
                          <span className="font-black text-base uppercase tracking-tight">{item.name}</span>
                        </div>
                        <span className="font-black text-lg italic">₹{item.price * item.quantity}</span>
                      </div>
                      {item.customization && (
                        <div className="flex flex-wrap items-center gap-2 pl-14">
                           <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20 text-primary bg-primary/5">{item.customization.size}</Badge>
                           <Badge variant="outline" className="text-[8px] font-black uppercase">{item.customization.temp}</Badge>
                           <Badge variant="outline" className="text-[8px] font-black uppercase">Sugar: {item.customization.sugar}</Badge>
                           {item.customization.addons?.length > 0 && (
                             <Badge variant="outline" className="text-[8px] font-black uppercase bg-secondary">Extras: {item.customization.addons.join(', ')}</Badge>
                           )}
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="pt-8 border-t-4 border-double border-muted mt-6 flex justify-between items-end">
                    <span className="font-black text-xs uppercase tracking-widest opacity-40 mb-1">Settlement Total</span>
                    <span className="text-3xl md:text-5xl font-headline font-black text-primary italic leading-none">₹{order.total}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-orange-gradient text-white overflow-hidden relative">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <CardContent className="p-8 space-y-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <Truck className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Logistic Help</p>
                    <h4 className="text-xl font-black uppercase tracking-tighter">Ezzy Buddy</h4>
                  </div>
                </div>
                <div className="space-y-3">
                  <Button className="w-full bg-white text-primary hover:bg-white/90 rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl" onClick={() => window.open('tel:8639366800')}>
                    <Phone className="w-4 h-4" /> Contact Fleet
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-primary"><MapPin className="w-4 h-4" /></div>
                   <h4 className="font-black text-[10px] uppercase tracking-widest opacity-40">Drop Destination</h4>
                </div>
                <p className="text-sm font-bold leading-relaxed text-muted-foreground italic">
                  "{order.address}"
                </p>
                {order.instructions && (
                  <div className="p-4 bg-secondary/30 rounded-2xl border border-dashed border-muted">
                     <p className="text-[8px] font-black uppercase opacity-40 mb-1">Rider Note</p>
                     <p className="text-xs font-medium italic">"{order.instructions}"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <WhatsAppButton />
    </div>
  );
}
