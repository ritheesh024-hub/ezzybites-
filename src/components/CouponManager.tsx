'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  TicketPercent, Plus, Trash2, 
  Loader2, Calendar, Percent, 
  Info, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, doc, setDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export const CouponManager = () => {
  const db = useFirestore();
  const couponsQuery = useMemo(() => db ? query(collection(db, 'coupons')) : null, [db]);
  const { data: coupons, loading } = useCollection<any>(couponsQuery);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discount: '10',
    isActive: true,
    expiryDate: '',
    description: 'Student Special Offer'
  });

  const handleAddCoupon = async () => {
    if (!db || !formData.code || !formData.discount) return;
    
    setSubmitting(true);
    const code = formData.code.toUpperCase();
    const couponRef = doc(db, 'coupons', code);
    const couponData = {
      code,
      discount: Number(formData.discount),
      isActive: formData.isActive,
      expiryDate: formData.expiryDate || null,
      description: formData.description,
      createdAt: serverTimestamp()
    };

    setDoc(couponRef, couponData)
      .then(() => {
        toast({ title: "Coupon Created", description: `Code ${code} is now active.` });
        setIsAddDialogOpen(false);
        setFormData({ code: '', discount: '10', isActive: true, expiryDate: '', description: 'Student Special Offer' });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: couponRef.path,
          operation: 'create',
          requestResourceData: couponData
        }));
      })
      .finally(() => setSubmitting(false));
  };

  const toggleCoupon = (code: string, currentState: boolean) => {
    if (!db) return;
    const couponRef = doc(db, 'coupons', code);
    updateDoc(couponRef, { isActive: !currentState }).catch(async (error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: couponRef.path,
        operation: 'update',
        requestResourceData: { isActive: !currentState }
      }));
    });
  };

  const handleDelete = (code: string) => {
    if (!db) return;
    const couponRef = doc(db, 'coupons', code);
    deleteDoc(couponRef).catch(async (error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: couponRef.path,
        operation: 'delete'
      }));
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black font-headline uppercase tracking-tighter">Offer <span className="text-primary italic">Engine</span></h2>
          <p className="text-muted-foreground text-sm font-medium">Manage promotional codes and student discounts.</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 bg-primary shadow-xl shadow-primary/20 hover:scale-105 transition-all">
          <Plus className="w-5 h-5" /> Create New Coupon
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="animate-spin w-10 h-10 text-primary mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Syncing Offers...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white dark:bg-zinc-900 rounded-[3rem] border-2 border-dashed border-muted">
            <TicketPercent className="w-12 h-12 text-muted-foreground opacity-20 mx-auto mb-4" />
            <p className="text-sm font-bold opacity-40">No active coupons found</p>
          </div>
        ) : coupons.map((coupon) => (
          <Card key={coupon.code} className={cn(
            "rounded-[2.5rem] border-none shadow-xl overflow-hidden group transition-all",
            !coupon.isActive && "opacity-60"
          )}>
            <div className={cn(
              "h-12 flex items-center justify-between px-6",
              coupon.isActive ? "bg-primary text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
            )}>
              <span className="font-black font-mono text-lg tracking-tighter">{coupon.code}</span>
              <Badge className="bg-white/20 border-none font-black text-[9px] uppercase">{coupon.discount}% OFF</Badge>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground italic">"{coupon.description}"</p>
                {coupon.expiryDate && (
                  <div className="flex items-center gap-2 text-[9px] font-bold opacity-50 uppercase">
                    <Calendar className="w-3 h-3" /> Expiry: {coupon.expiryDate}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-dashed">
                <div className="flex items-center gap-3">
                   <Switch checked={coupon.isActive} onCheckedChange={() => toggleCoupon(coupon.code, coupon.isActive)} />
                   <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                     {coupon.isActive ? 'Active' : 'Disabled'}
                   </span>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(coupon.code)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-10 border-none bg-white dark:bg-zinc-900 shadow-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-headline uppercase tracking-tighter">New <span className="text-primary italic">Coupon</span></DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Coupon Code</Label>
              <Input 
                placeholder="E.g. STUDENT10" 
                value={formData.code} 
                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                className="h-14 rounded-xl border-muted bg-secondary/20 dark:bg-zinc-800 font-mono font-black text-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Discount (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="number" 
                    value={formData.discount} 
                    onChange={(e) => setFormData({...formData, discount: e.target.value})}
                    className="h-14 pl-12 rounded-xl border-muted bg-secondary/20 dark:bg-zinc-800 font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Expiry Date</Label>
                <Input 
                  type="date" 
                  value={formData.expiryDate} 
                  onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                  className="h-14 rounded-xl border-muted bg-secondary/20 dark:bg-zinc-800 font-bold"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Internal Description</Label>
              <Input 
                placeholder="Student Special Offer" 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="h-14 rounded-xl border-muted bg-secondary/20 dark:bg-zinc-800 font-bold"
              />
            </div>
            <Button className="w-full h-16 rounded-2xl font-black text-lg bg-primary text-white mt-4" onClick={handleAddCoupon} disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : 'Launch Coupon'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
