'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Calculator, History, 
  Search, Plus, Minus, Trash2, Printer, 
  ShoppingBag, Utensils, 
  Package,
  Loader2,
  CheckCircle2,
  X
} from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { format } from 'date-fns';
import { useGlobalSettings } from '@/hooks/use-global-settings';

interface BillingSystemProps {
  products: any[];
  orders: any[];
}

export const BillingSystem = ({ products, orders }: BillingSystemProps) => {
  const db = useFirestore();
  const { user } = useUser();
  const { settings } = useGlobalSettings();
  
  const [activeBill, setActiveBill] = useState<any[]>([]);
  const [orderType, setOrderType] = useState('Dine-In');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', notes: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const updateQuantity = (product: any, delta: number) => {
    setActiveBill(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        const newQty = Math.max(0, existing.quantity + delta);
        if (newQty === 0) return prev.filter(p => p.id !== product.id);
        return prev.map(p => p.id === product.id ? { ...p, quantity: newQty } : p);
      }
      if (delta > 0) return [...prev, { ...product, quantity: 1 }];
      return prev;
    });
  };

  const removeFromBill = (id: string) => {
    setActiveBill(prev => prev.filter(p => p.id !== id));
  };

  const subtotal = activeBill.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const total = subtotal - discount;

  const generateBill = async () => {
    if (activeBill.length === 0 || !customerInfo.phone || !db || !user) return;
    setLoading(true);
    const billId = `EB-${Math.floor(100000 + Math.random() * 899999)}`;
    const billData = {
      orderId: billId,
      customerName: customerInfo.name || 'Guest',
      customerPhone: customerInfo.phone,
      orderType: orderType,
      instructions: customerInfo.notes,
      items: activeBill.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
      subtotal,
      discount,
      total,
      paymentMethod,
      status: 'delivered',
      isStoreBill: true,
      processedBy: user.uid,
      cashierName: user.displayName || user.email?.split('@')[0] || 'Staff',
      createdAt: serverTimestamp()
    };

    setDoc(doc(db, 'orders', billId), billData)
      .then(() => {
        toast({ title: "Bill Generated Successfully" });
        setViewingInvoice({ ...billData, createdAt: new Date() });
        setActiveBill([]);
        setCustomerInfo({ name: '', phone: '', notes: '' });
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <Tabs defaultValue="pos" className="w-full">
        <TabsList className="bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border mb-8 flex w-fit shadow-sm overflow-hidden">
          <TabsTrigger value="pos" className="px-10 py-3.5 rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white shadow-none border-none"><Calculator className="w-4 h-4" /> POS Counter</TabsTrigger>
          <TabsTrigger value="history" className="px-10 py-3.5 rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white shadow-none border-none"><History className="w-4 h-4" /> Bill History</TabsTrigger>
        </TabsList>

        <TabsContent value="pos" className="outline-none">
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 overflow-hidden">
                <CardHeader className="p-8 border-b bg-muted/5">
                  <div className="relative w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground opacity-40" />
                    <Input placeholder="Search dishes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-14 pl-14 rounded-2xl border-none bg-secondary/30 dark:bg-zinc-800 font-bold text-base" />
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map(p => {
                      const cartItem = activeBill.find(i => i.id === p.id);
                      return (
                        <div key={p.id} className="bg-secondary/20 dark:bg-zinc-800/50 rounded-[1.8rem] p-4 flex flex-col group border border-transparent hover:border-primary/10">
                          <div className="aspect-square rounded-2xl overflow-hidden mb-4 relative bg-white">
                            <Image src={p.imageUrl} alt={p.name} fill className="object-cover group-hover:scale-110 transition-all duration-700" unoptimized />
                          </div>
                          <h4 className="font-black text-xs uppercase truncate mb-1">{p.name}</h4>
                          <p className="text-primary font-black text-base italic mb-4">₹{p.price}</p>
                          <Button onClick={() => updateQuantity(p, 1)} variant={cartItem ? "default" : "outline"} className="w-full h-10 rounded-xl font-black uppercase text-[10px]">
                            {cartItem ? `x${cartItem.quantity}` : 'Add +'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-900 sticky top-24 p-8 space-y-8">
                  <h3 className="text-xl font-black uppercase italic">Settlement</h3>
                  <div className="space-y-4">
                     {activeBill.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-zinc-50 p-4 rounded-2xl">
                           <span className="font-black text-[10px] uppercase truncate flex-1">{item.name}</span>
                           <div className="flex items-center gap-3">
                              <button onClick={() => updateQuantity(item, -1)}><Minus className="w-4 h-4" /></button>
                              <span className="font-black text-xs">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item, 1)}><Plus className="w-4 h-4" /></button>
                           </div>
                        </div>
                     ))}
                  </div>
                  <div className="pt-6 border-t-2 border-dashed space-y-4">
                    <div className="flex justify-between font-black text-2xl text-primary italic"><span>Total</span><span>₹{total}</span></div>
                    <Button onClick={generateBill} disabled={loading || activeBill.length === 0} className="w-full h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-primary">
                       {loading ? <Loader2 className="animate-spin" /> : 'Settle & Print'}
                    </Button>
                  </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
           <Card className="rounded-[3rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-8">
              <p className="text-center opacity-10 py-20 font-black uppercase tracking-widest italic">Bill history node active</p>
           </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!viewingInvoice} onOpenChange={(open) => !open && setViewingInvoice(null)}>
        <DialogContent className="max-w-md p-0 rounded-[3rem] overflow-hidden border-none shadow-3xl bg-white text-black">
          <DialogHeader className="p-6 bg-emerald-600 text-white flex flex-row items-center justify-between">
             <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6" />
                <DialogTitle className="font-black uppercase text-xs tracking-widest">Bill Generated</DialogTitle>
             </div>
             <button onClick={() => setViewingInvoice(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"><X className="w-4 h-4" /></button>
          </DialogHeader>
          <div className="p-10 text-center">
             <h2 className="text-3xl font-black font-headline tracking-tighter mb-4 italic">#{viewingInvoice?.orderId}</h2>
             <p className="text-muted-foreground font-medium text-xs mb-8">Protocol generated for {viewingInvoice?.customerName}</p>
             <div className="flex gap-3">
                <Button className="flex-1 h-14 rounded-xl font-black uppercase text-[9px] tracking-widest bg-zinc-950 text-white" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" /> Print Bill</Button>
                <Button variant="outline" className="flex-1 h-14 rounded-xl font-black uppercase text-[9px] tracking-widest border-2" onClick={() => setViewingInvoice(null)}>Close</Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
