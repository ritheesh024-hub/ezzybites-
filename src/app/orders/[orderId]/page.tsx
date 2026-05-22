
"use client"
import React, { useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { useParams } from 'next/navigation';
import { CheckCircle2, Clock, MapPin, Phone, MessageSquare, Truck, ChefHat, PackageCheck, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const db = useFirestore();

  const orderRef = useMemo(() => {
    if (!db || !orderId) return null;
    return doc(db, 'orders', orderId);
  }, [db, orderId]);

  const { data: order, loading, error } = useDoc<any>(orderRef);

  const statusMap: Record<string, number> = {
    'Pending': 1,
    'Preparing': 2,
    'Out for Delivery': 3,
    'Delivered': 4,
    'Cancelled': 0
  };

  const statusLevel = order ? statusMap[order.status] || 1 : 1;

  const steps = [
    { id: 1, title: 'Order Placed', icon: PackageCheck, desc: 'We have received your order.' },
    { id: 2, title: 'Preparing Food', icon: ChefHat, desc: 'Our chef is crafting your meal.' },
    { id: 3, title: 'Out for Delivery', icon: Truck, desc: 'Our rider is on the way.' },
    { id: 4, title: 'Delivered', icon: CheckCircle2, desc: 'Enjoy your delicious bites!' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Locating your order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-destructive/20 mb-6" />
        <h2 className="text-2xl font-black mb-2">Order Not Found</h2>
        <p className="text-muted-foreground mb-8">We couldn't find an order with ID: <span className="font-mono text-primary font-bold">{orderId}</span></p>
        <Link href="/">
          <Button className="rounded-full px-10 h-14 font-black">Go Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10 pb-12 overflow-x-hidden">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl pt-24 md:pt-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-3 px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[10px]">
              Live Tracking
            </Badge>
            <h1 className="text-2xl md:text-4xl font-headline font-black">Order <span className="text-primary">{order.orderId}</span></h1>
            <p className="text-sm font-medium mt-1">Status: <span className={cn(
              "font-bold",
              order.status === 'Cancelled' ? 'text-destructive' : 'text-primary'
            )}>{order.status}</span></p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-full h-12 px-6 gap-2 font-bold" onClick={() => window.open('https://wa.me/918639366800', '_blank')}>
              <MessageSquare className="w-4 h-4" />
              Chat Help
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-[32px] md:rounded-[40px] border-none shadow-2xl overflow-hidden bg-card">
              <CardContent className="p-6 md:p-10">
                {order.status === 'Cancelled' ? (
                   <div className="text-center py-10">
                      <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8" />
                      </div>
                      <h4 className="text-2xl font-black mb-2">Order Cancelled</h4>
                      <p className="text-muted-foreground">This order has been cancelled.</p>
                   </div>
                ) : (
                  <div className="relative space-y-10">
                    <div className="absolute left-6 top-6 w-0.5 h-[calc(100%-48px)] bg-muted z-0" />
                    {steps.map((step, idx) => {
                      const Icon = step.icon;
                      const isActive = statusLevel >= step.id;
                      const isCurrent = statusLevel === step.id;

                      return (
                        <div key={idx} className={`relative z-10 flex gap-6 md:gap-8 items-start transition-all duration-700 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all shrink-0 ${isActive ? 'bg-primary text-white scale-110' : 'bg-muted text-muted-foreground'}`}>
                            <Icon className="w-5 h-5 md:w-6 md:h-6" />
                          </div>
                          <div className="flex-1">
                            <h4 className={`text-lg md:text-xl font-black ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{step.title}</h4>
                            <p className="text-xs md:text-sm font-medium text-muted-foreground">{step.desc}</p>
                            {isCurrent && (
                              <div className="mt-2 flex gap-2 items-center">
                                <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                                <div className="text-[10px] font-black uppercase tracking-widest text-primary">Live Now</div>
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

            <Card className="rounded-[32px] border-none shadow-xl">
              <CardContent className="p-6 md:p-8">
                <h4 className="font-black text-lg uppercase tracking-widest mb-6">Summary</h4>
                <div className="space-y-4">
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-primary">x{item.quantity}</span>
                        <span className="font-bold">{item.name}</span>
                      </div>
                      <span className="font-bold">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-dashed mt-4 flex justify-between items-center">
                    <span className="font-black text-lg">Total</span>
                    <span className="text-xl md:text-2xl font-black text-primary">₹{order.total}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="rounded-[32px] border-none shadow-xl bg-primary text-white overflow-hidden relative">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <CardContent className="p-6 md:p-8 space-y-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Support</p>
                    <h4 className="text-lg font-black">Ezzy Helper</h4>
                  </div>
                </div>
                <Button className="w-full bg-white text-primary hover:bg-white/90 rounded-2xl h-12 font-black gap-2" onClick={() => window.open('tel:8639366800')}>
                  <Phone className="w-4 h-4" />
                  Call Now
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-none shadow-xl">
              <CardContent className="p-6 md:p-8 space-y-4">
                <h4 className="font-black text-lg uppercase tracking-widest">Address</h4>
                <div className="flex gap-4 items-start">
                  <MapPin className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-xs md:text-sm font-medium text-muted-foreground leading-relaxed">
                    {order.address}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <WhatsAppButton />
    </div>
  );
}
