
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  Calculator, Receipt, History, 
  Search, Plus, Minus, Trash2, Printer, 
  ShoppingBag, Utensils, 
  Package
} from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface BillingSystemProps {
  products: any[];
  orders: any[];
}

export const BillingSystem = ({ products, orders }: BillingSystemProps) => {
  const db = useFirestore();
  const [activeBill, setActiveBill] = useState<any[]>([]);
  const [orderType, setOrderType] = useState('Dine-In');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', notes: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);

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
    if (activeBill.length === 0) {
      toast({ variant: "destructive", title: "Cart Empty" });
      return;
    }
    if (!customerInfo.phone) {
      toast({ variant: "destructive", title: "Mobile Required" });
      return;
    }

    const billId = `EB-${Date.now().toString().slice(-6)}`;
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
      status: 'Delivered',
      isStoreBill: true,
      createdAt: new Date()
    };

    if (db) {
      const billRef = doc(db, 'orders', billId);
      setDoc(billRef, { ...billData, createdAt: serverTimestamp() }).then(() => {
        toast({ title: "Invoice Generated" });
        setViewingInvoice(billData);
        setActiveBill([]);
        setCustomerInfo({ name: '', phone: '', notes: '' });
        setDiscount(0);
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pos" className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl border mb-6 flex w-fit shadow-sm">
          <TabsTrigger value="pos" className="px-8 py-3 rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest"><Calculator className="w-4 h-4" /> POS Counter</TabsTrigger>
          <TabsTrigger value="history" className="px-8 py-3 rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest"><History className="w-4 h-4" /> Bill History</TabsTrigger>
        </TabsList>

        <TabsContent value="pos">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[ { id: 'Dine-In', icon: Utensils }, { id: 'Take Away', icon: Package } ].map(type => (
              <button key={type.id} onClick={() => setOrderType(type.id)} className={cn("flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all gap-3", orderType === type.id ? "border-primary bg-primary/5 text-primary shadow-lg" : "border-muted bg-white text-muted-foreground hover:border-primary/20")}>
                <type.icon className="w-6 h-6" />
                <span className="text-xs font-black uppercase">{type.id}</span>
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="p-6 border-b">
                  <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search dishes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-12 pl-12 rounded-xl border-muted bg-secondary/30 font-bold" />
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map(p => {
                      const cartItem = activeBill.find(i => i.id === p.id);
                      return (
                        <div key={p.id} className="bg-secondary/20 rounded-[1.5rem] p-3 transition-all hover:shadow-md flex flex-col h-full group">
                          <div className="aspect-square rounded-xl overflow-hidden mb-3 relative bg-white">
                            <Image src={p.imageUrl} alt={p.name} fill className="object-cover group-hover:scale-110 transition-all" unoptimized />
                          </div>
                          <h4 className="font-bold text-[11px] truncate leading-tight mb-1">{p.name}</h4>
                          <p className="text-primary font-black text-xs mb-3">₹{p.price}</p>
                          <div className="mt-auto">
                            {cartItem ? (
                              <div className="flex items-center justify-between w-full bg-primary text-white rounded-xl h-10 px-2 gap-2">
                                <button onClick={() => updateQuantity(p, -1)} className="p-1 hover:bg-white/20 rounded-md transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                                <span className="font-black text-xs w-4 text-center">{cartItem.quantity}</span>
                                <button onClick={() => updateQuantity(p, 1)} className="p-1 hover:bg-white/20 rounded-md transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                              </div>
                            ) : (
                              <Button onClick={() => updateQuantity(p, 1)} variant="outline" className="w-full h-10 rounded-xl border-primary/30 text-primary font-black uppercase text-[9px] hover:bg-primary hover:text-white transition-all">
                                <Plus className="w-3 h-3 mr-1" /> Add
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
              <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white sticky top-24">
                <CardHeader className="p-6 border-b flex items-center justify-between">
                  <CardTitle className="text-lg font-black font-headline">Bill Summary</CardTitle>
                  <Badge variant="outline" className="text-[9px] font-black uppercase">{orderType}</Badge>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase opacity-40">Mobile</Label>
                      <Input value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} placeholder="Mobile" className="h-10 rounded-xl bg-secondary/30 border-none text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase opacity-40">Name</Label>
                      <Input value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} placeholder="Guest" className="h-10 rounded-xl bg-secondary/30 border-none text-xs" />
                    </div>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1 scrollbar-hide">
                    {activeBill.length === 0 ? (
                      <div className="text-center py-10 opacity-30">
                        <ShoppingBag className="w-10 h-10 mx-auto mb-2" />
                        <p className="text-[9px] font-black uppercase">No items selected</p>
                      </div>
                    ) : (
                      activeBill.map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-secondary/10 p-3 rounded-xl">
                          <div className="flex-1 truncate mr-2">
                            <h5 className="font-bold text-[10px] truncate">{item.name}</h5>
                            <p className="text-[9px] font-black text-primary">₹{item.price * item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-2 bg-white rounded-lg p-1">
                            <button onClick={() => updateQuantity(item, -1)} className="p-1 hover:bg-secondary/20 rounded transition-colors"><Minus className="w-3 h-3" /></button>
                            <span className="text-[10px] font-black w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item, 1)} className="p-1 hover:bg-secondary/20 rounded transition-colors"><Plus className="w-3 h-3" /></button>
                          </div>
                          <button onClick={() => removeFromBill(item.id)} className="ml-2 text-destructive/40 hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-dashed">
                    <div className="flex justify-between items-center text-xs font-black uppercase">
                      <span>Grand Total</span>
                      <span className="text-2xl text-primary italic">₹{total}</span>
                    </div>
                    <Button onClick={generateBill} className="w-full h-14 rounded-2xl text-base font-black bg-primary">Generate Bill</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="rounded-[2rem] border-none shadow-xl bg-white p-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/10 border-b">
                  <tr className="text-[9px] font-black uppercase text-muted-foreground">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.filter(o => o.isStoreBill).map(inv => (
                    <tr key={inv.orderId} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-6 py-4 font-black text-primary">#{inv.orderId}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-xs">{inv.customerName}</p>
                        <p className="text-[9px] text-muted-foreground">{inv.customerPhone}</p>
                      </td>
                      <td className="px-6 py-4"><Badge variant="outline" className="text-[8px] uppercase">{inv.orderType}</Badge></td>
                      <td className="px-6 py-4 font-black text-primary">₹{inv.total}</td>
                      <td className="px-6 py-4"><Button variant="ghost" size="sm" onClick={() => setViewingInvoice(inv)}><Printer className="w-4 h-4 mr-2" /> Print</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!viewingInvoice} onOpenChange={() => setViewingInvoice(null)}>
        <DialogContent className="max-w-md p-0 rounded-[2.5rem] overflow-hidden border-none shadow-3xl bg-white">
          <div id="print-area" className="p-10 text-black">
            <div className="text-center mb-8 pb-8 border-b-2 border-dashed">
              <h2 className="text-2xl font-black font-headline tracking-tighter uppercase">EZZY BITES</h2>
              <p className="text-[9px] font-black uppercase opacity-40">Invoice # {viewingInvoice?.orderId}</p>
              <Badge className="bg-primary/10 text-primary mt-3 uppercase font-black text-[8px] px-4 py-1">{viewingInvoice?.orderType}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-6 text-[11px] font-bold mb-8">
              <div>
                <p className="uppercase text-[8px] opacity-40 mb-1">Customer</p>
                <p>{viewingInvoice?.customerName}</p>
                <p>+91 {viewingInvoice?.customerPhone}</p>
              </div>
              <div className="text-right">
                <p className="uppercase text-[8px] opacity-40 mb-1">Date</p>
                <p>{viewingInvoice?.createdAt ? new Date(viewingInvoice.createdAt).toLocaleString() : 'Recent'}</p>
              </div>
            </div>
            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-4 text-[9px] font-black uppercase opacity-40 border-b pb-2">
                <span className="col-span-2">Item</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Price</span>
              </div>
              {viewingInvoice?.items.map((item: any, i: number) => (
                <div key={i} className="grid grid-cols-4 text-xs font-black">
                  <span className="col-span-2">{item.name}</span>
                  <span className="text-center">x{item.quantity}</span>
                  <span className="text-right">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t-2 border-dashed flex justify-between items-end">
              <span className="text-sm font-black uppercase tracking-widest">Total Amount</span>
              <span className="text-3xl font-black text-primary italic">₹{viewingInvoice?.total}</span>
            </div>
            <div className="mt-8 text-center opacity-40">
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Visit Again • Stay Ezzy</p>
            </div>
          </div>
          <div className="p-6 bg-secondary/20 flex gap-4">
            <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black text-[10px] uppercase" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" /> Print</Button>
            <Button className="flex-1 h-14 rounded-2xl font-black text-[10px] uppercase bg-primary" onClick={() => setViewingInvoice(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: fixed; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
};
