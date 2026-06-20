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

interface BillingSystemProps {
  products: any[];
  orders: any[];
}

export const BillingSystem = ({ products, orders }: BillingSystemProps) => {
  const db = useFirestore();
  const { user } = useUser();
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
  const tax = Math.round(subtotal * 0.05); // 5% GST
  const total = subtotal - discount + tax;

  const generateBill = async () => {
    if (activeBill.length === 0) {
      toast({ variant: "destructive", title: "Cart Empty" });
      return;
    }
    if (!customerInfo.phone) {
      toast({ variant: "destructive", title: "Mobile Required" });
      return;
    }
    if (!db || !user) return;

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
      tax,
      discount,
      total,
      paymentMethod,
      status: 'delivered',
      isStoreBill: true,
      processedBy: user.uid,
      cashierName: user.displayName || user.email?.split('@')[0] || 'Staff',
      createdAt: serverTimestamp()
    };

    const billRef = doc(db, 'orders', billId);
    setDoc(billRef, billData)
      .then(() => {
        const staffRef = doc(db, 'admins', user.uid);
        updateDoc(staffRef, {
          'stats.billsGenerated': increment(1),
          'stats.ordersHandled': increment(1)
        }).catch(err => console.warn("Failed to update staff stats", err));

        toast({ title: "Bill Generated Successfully" });
        setViewingInvoice({ ...billData, createdAt: new Date() });
        setActiveBill([]);
        setCustomerInfo({ name: '', phone: '', notes: '' });
        setDiscount(0);
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: billRef.path,
          operation: 'create',
          requestResourceData: billData,
        }));
      })
      .finally(() => setLoading(false));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <Tabs defaultValue="pos" className="w-full">
        <TabsList className="bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border mb-8 flex w-fit shadow-sm overflow-hidden">
          <TabsTrigger value="pos" className="px-10 py-3.5 rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest transition-all data-[state=active]:bg-primary data-[state=active]:text-white shadow-none border-none"><Calculator className="w-4 h-4" /> POS Counter</TabsTrigger>
          <TabsTrigger value="history" className="px-10 py-3.5 rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest transition-all data-[state=active]:bg-primary data-[state=active]:text-white shadow-none border-none"><History className="w-4 h-4" /> Bill History</TabsTrigger>
        </TabsList>

        <TabsContent value="pos" className="outline-none">
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[ { id: 'Dine-In', icon: Utensils }, { id: 'Take Away', icon: Package } ].map(type => (
              <button key={type.id} onClick={() => setOrderType(type.id)} className={cn("flex items-center justify-center p-6 rounded-[2rem] border-2 transition-all gap-4", orderType === type.id ? "border-primary bg-primary/5 text-primary shadow-xl" : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-muted-foreground hover:border-primary/20")}>
                <type.icon className="w-6 h-6" />
                <span className="text-sm font-black uppercase tracking-widest">{type.id}</span>
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 overflow-hidden">
                <CardHeader className="p-8 border-b bg-muted/5">
                  <div className="relative w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground opacity-40" />
                    <Input placeholder="Search dishes by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-14 pl-14 rounded-2xl border-none bg-secondary/30 dark:bg-zinc-800 font-bold text-base" />
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map(p => {
                      const cartItem = activeBill.find(i => i.id === p.id);
                      return (
                        <div key={p.id} className="bg-secondary/20 dark:bg-zinc-800/50 rounded-[1.8rem] p-4 transition-all hover:shadow-xl flex flex-col h-full group border border-transparent hover:border-primary/10">
                          <div className="aspect-square rounded-2xl overflow-hidden mb-4 relative bg-white">
                            <Image src={p.imageUrl} alt={p.name} fill className="object-cover group-hover:scale-110 transition-all duration-700" unoptimized />
                          </div>
                          <h4 className="font-black text-xs uppercase truncate leading-none mb-1 group-hover:text-primary transition-colors">{p.name}</h4>
                          <p className="text-primary font-black text-base italic mb-4">₹{p.price}</p>
                          <div className="mt-auto">
                            {cartItem ? (
                              <div className="flex items-center justify-between w-full bg-primary text-white rounded-xl h-11 px-2 gap-2 shadow-lg shadow-primary/20">
                                <button onClick={() => updateQuantity(p, -1)} className="p-1.5 hover:bg-white/20 rounded-md transition-colors"><Minus className="w-4 h-4" /></button>
                                <span className="font-black text-sm w-4 text-center">{cartItem.quantity}</span>
                                <button onClick={() => updateQuantity(p, 1)} className="p-1.5 hover:bg-white/20 rounded-md transition-colors"><Plus className="w-4 h-4" /></button>
                              </div>
                            ) : (
                              <Button onClick={() => updateQuantity(p, 1)} variant="outline" className="w-full h-11 rounded-xl border-primary/20 text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all">
                                <Plus className="w-4 h-4 mr-1" /> Add
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-900 sticky top-24">
                <CardHeader className="p-8 border-b bg-muted/5 flex flex-row items-center justify-between">
                  <CardTitle className="text-xl font-black font-headline uppercase tracking-tighter italic">Settlement</CardTitle>
                  <Badge variant="outline" className="text-[9px] font-black uppercase px-3 py-1 rounded-full">{orderType}</Badge>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase opacity-40 ml-1">Phone Node</Label>
                      <Input value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} placeholder="00000 00000" className="h-11 rounded-xl bg-secondary/30 dark:bg-zinc-800 border-none font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase opacity-40 ml-1">Identity</Label>
                      <Input value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} placeholder="Guest" className="h-11 rounded-xl bg-secondary/30 dark:bg-zinc-800 border-none font-bold" />
                    </div>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto space-y-4 pr-1 scrollbar-hide">
                    {activeBill.length === 0 ? (
                      <div className="text-center py-12 opacity-20 bg-secondary/10 rounded-[2rem] border-2 border-dashed">
                        <ShoppingBag className="w-10 h-10 mx-auto mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Cart Reserved</p>
                      </div>
                    ) : (
                      activeBill.map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-transparent hover:border-primary/10 transition-all">
                          <div className="flex-1 truncate mr-4">
                            <h5 className="font-black text-[10px] uppercase truncate group-hover:text-primary transition-colors mb-0.5">{item.name}</h5>
                            <p className="text-[11px] font-black text-primary italic">₹{item.price * item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-3 bg-white dark:bg-zinc-700 rounded-xl p-1.5 shadow-sm">
                            <button onClick={() => updateQuantity(item, -1)} className="p-1 hover:bg-secondary/20 rounded transition-colors dark:text-white"><Minus className="w-3.5 h-3.5" /></button>
                            <span className="text-xs font-black w-4 text-center dark:text-white">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item, 1)} className="p-1 hover:bg-secondary/20 rounded transition-colors dark:text-white"><Plus className="w-3.5 h-3.5" /></button>
                          </div>
                          <button onClick={() => removeFromBill(item.id)} className="ml-3 text-destructive/30 hover:text-destructive transition-colors"><Trash2 className="w-4.5 h-4.5" /></button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-4 pt-6 border-t-2 border-dashed">
                    <div className="space-y-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                       <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
                       <div className="flex justify-between text-emerald-600"><span>Tax (5% GST)</span><span>+ ₹{tax}</span></div>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Gross Total</span>
                      <span className="text-4xl font-black font-headline text-primary italic leading-none">₹{total}</span>
                    </div>
                    <Button onClick={generateBill} disabled={loading || activeBill.length === 0} className="w-full h-16 rounded-[1.5rem] text-base font-black uppercase tracking-[0.2em] bg-primary shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all">
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Settle & Print'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="outline-none">
          <Card className="rounded-[3rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-8 md:p-12">
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                  <tr className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">
                    <th className="px-10 py-6">Identity Ticker</th>
                    <th className="px-10 py-6">Entity Details</th>
                    <th className="px-10 py-6">Node Type</th>
                    <th className="px-10 py-6">Gross Amount</th>
                    <th className="px-10 py-6 text-right">Ledger Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                  {orders.filter(o => o.isStoreBill).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-24 text-center opacity-10">
                        <Calculator className="w-16 h-16 mx-auto mb-4" />
                        <p className="font-black uppercase tracking-[0.4em] text-sm italic">No Settlement Records</p>
                      </td>
                    </tr>
                  ) : orders.filter(o => o.isStoreBill).map(inv => (
                    <tr 
                      key={inv.orderId} 
                      className="hover:bg-primary/5 transition-all group cursor-pointer"
                      onClick={() => setViewingInvoice(inv)}
                    >
                      <td className="px-10 py-6 font-black text-primary italic">#{inv.orderId}</td>
                      <td className="px-10 py-6">
                        <p className="font-black text-sm uppercase tracking-tight truncate max-w-[150px] group-hover:text-primary transition-colors">{inv.customerName}</p>
                        <p className="text-[10px] font-bold opacity-40">+91 {inv.customerPhone}</p>
                      </td>
                      <td className="px-10 py-6"><Badge variant="outline" className="text-[8px] uppercase font-black px-3 py-1 rounded-full bg-secondary/50 border-none">{inv.orderType}</Badge></td>
                      <td className="px-10 py-6 font-black text-lg text-primary italic">₹{inv.total}</td>
                      <td className="px-10 py-6 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="rounded-xl font-black uppercase text-[9px] tracking-widest gap-2 hover:bg-primary/10 hover:text-primary transition-all px-4 h-10" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingInvoice(inv);
                          }}
                        >
                          <Printer className="w-4 h-4" /> Manifest
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* SUCCESS & INVOICE MODAL */}
      <Dialog open={!!viewingInvoice} onOpenChange={(open) => !open && setViewingInvoice(null)}>
        <DialogContent className="max-w-md p-0 rounded-[3rem] overflow-hidden border-none shadow-3xl bg-white text-black">
          <div className="bg-emerald-600 p-6 text-white flex items-center gap-3 no-print">
             <CheckCircle2 className="w-6 h-6" />
             <span className="font-black uppercase text-xs tracking-widest">Bill Generated Successfully</span>
          </div>
          
          <div id="print-area" className="p-10 bg-white">
            {/* RECEIPT HEADER */}
            <div className="text-center mb-8 pb-6 border-b-2 border-dashed border-zinc-200">
              <h2 className="text-3xl font-black font-headline tracking-tighter uppercase leading-none mb-1">EZZY BITES</h2>
              <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-50 mb-4">Premium Fast Food-Tech</p>
              
              <div className="bg-zinc-100 py-3 rounded-xl mb-4">
                 <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-0.5">Bill Number</p>
                 <h4 className="text-4xl font-black font-mono tracking-tighter text-primary">{viewingInvoice?.orderId}</h4>
              </div>
              
              <div className="flex justify-center gap-2">
                 <Badge className="bg-zinc-950 text-white uppercase font-black text-[7px] px-3 py-1 rounded-md border-none tracking-widest">{viewingInvoice?.orderType}</Badge>
                 <Badge variant="outline" className="uppercase font-black text-[7px] px-3 py-1 rounded-md border-zinc-200 tracking-widest">{viewingInvoice?.paymentMethod || 'Cash'}</Badge>
              </div>
            </div>
            
            {/* RECEIPT METADATA */}
            <div className="grid grid-cols-2 gap-4 text-[10px] font-bold mb-8">
              <div className="space-y-1">
                <p className="uppercase text-[7px] font-black opacity-30 tracking-widest">CUSTOMER</p>
                <p className="uppercase truncate">{viewingInvoice?.customerName}</p>
                <p className="opacity-60">+91 {viewingInvoice?.customerPhone}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="uppercase text-[7px] font-black opacity-30 tracking-widest">STATION LOG</p>
                <p className="uppercase truncate">{viewingInvoice?.cashierName || 'Staff Node'}</p>
                <p className="opacity-60">{viewingInvoice?.createdAt ? format(new Date(viewingInvoice.createdAt), 'dd MMM yyyy, p') : 'Pending Sync'}</p>
              </div>
            </div>

            {/* ITEM TABLE */}
            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-5 text-[8px] font-black uppercase opacity-30 border-b pb-2 border-zinc-100 tracking-widest">
                <span className="col-span-3">DESCRIPTION</span>
                <span className="text-center">QTY</span>
                <span className="text-right">PRICE</span>
              </div>
              {viewingInvoice?.items.map((item: any, i: number) => (
                <div key={i} className="grid grid-cols-5 text-[11px] font-black uppercase tracking-tight">
                  <span className="col-span-3 truncate pr-2">{item.name}</span>
                  <span className="text-center opacity-60">x{item.quantity}</span>
                  <span className="text-right italic">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* TOTALS */}
            <div className="pt-6 border-t-2 border-dashed border-zinc-200 space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-40">
                 <span>Subtotal</span>
                 <span>₹{viewingInvoice?.subtotal}</span>
              </div>
              {viewingInvoice?.tax > 0 && (
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-emerald-600">
                   <span>Tax (5% GST)</span>
                   <span>₹{viewingInvoice?.tax}</span>
                </div>
              )}
              {viewingInvoice?.discount > 0 && (
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-rose-600">
                   <span>Discount</span>
                   <span>- ₹{viewingInvoice?.discount}</span>
                </div>
              )}
              <div className="pt-4 flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Grand Total</span>
                <span className="text-5xl font-black text-primary italic leading-none">₹{viewingInvoice?.total}</span>
              </div>
            </div>
            
            {/* FOOTER */}
            <div className="mt-12 text-center opacity-40">
               <p className="text-[8px] font-black uppercase tracking-[0.4em]">Visit Again • Stay Ezzy</p>
               <p className="text-[6px] font-bold mt-1 opacity-50 uppercase">Authorized Hub Generated • Pocharam Campus</p>
            </div>
          </div>

          <div className="p-8 bg-zinc-50 flex gap-4 no-print">
            <Button 
              className="flex-1 h-16 rounded-[1.5rem] font-black text-[10px] uppercase bg-zinc-950 text-white shadow-xl gap-2 tracking-widest" 
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4" /> Print Bill
            </Button>
            <Button 
              variant="outline"
              className="flex-1 h-16 rounded-[1.5rem] font-black text-[10px] uppercase border-2 text-zinc-400 gap-2 tracking-widest" 
              onClick={() => setViewingInvoice(null)}
            >
              <X className="w-4 h-4" /> Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { 
            position: fixed; 
            left: 0; 
            top: 0; 
            width: 100%; 
            height: 100%; 
            background: white !important; 
            z-index: 10000; 
            padding: 20px;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};
