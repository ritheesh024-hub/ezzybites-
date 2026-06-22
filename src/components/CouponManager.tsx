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
  Loader2, Edit2, Info, AlertCircle, 
  CheckCircle2, IndianRupee, Hash,
  Calendar, Percent, X
} from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { 
  collection, query, doc, setDoc, deleteDoc, 
  serverTimestamp, updateDoc, getDoc, orderBy 
} from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const CouponManager = () => {
  const db = useFirestore();
  const couponsQuery = useMemo(() => db ? query(collection(db, 'coupons'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: coupons, loading } = useCollection<any>(couponsQuery);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    discount: '10',
    type: 'percent' as 'percent' | 'flat',
    isActive: true,
    expiryDate: '',
    minOrderValue: '0',
    usageLimit: '0',
    description: 'Special offer for our elite community.'
  });

  const handleOpenModal = (coupon: any = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code || '',
        discount: String(coupon.discount || '10'),
        type: (coupon.type as 'percent' | 'flat') || 'percent',
        isActive: coupon.isActive ?? true,
        expiryDate: coupon.expiryDate || '',
        minOrderValue: String(coupon.minOrderValue || '0'),
        usageLimit: String(coupon.usageLimit || '0'),
        description: coupon.description || 'Special offer for our elite community.'
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        discount: '10',
        type: 'percent',
        isActive: true,
        expiryDate: '',
        minOrderValue: '0',
        usageLimit: '0',
        description: 'Special offer for our elite community.'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!db || !formData.code || !formData.discount) {
      toast({ variant: "destructive", title: "Missing Identity", description: "Bounty Code and Discount Value are required." });
      return;
    }
    
    setSubmitting(true);
    const code = formData.code.trim().toUpperCase();
    const couponRef = doc(db, 'coupons', code);
    
    const couponData = {
      code,
      discount: Number(formData.discount),
      type: formData.type,
      isActive: formData.isActive,
      expiryDate: formData.expiryDate || null,
      minOrderValue: Number(formData.minOrderValue || 0),
      usageLimit: Number(formData.usageLimit || 0),
      description: formData.description,
      usageCount: editingCoupon?.usageCount || 0,
      updatedAt: serverTimestamp(),
      createdAt: editingCoupon?.createdAt || serverTimestamp()
    };

    try {
      // If we are editing and the code (document ID) has changed
      if (editingCoupon && editingCoupon.code !== code) {
        const checkSnap = await getDoc(couponRef);
        if (checkSnap.exists()) {
          throw new Error(`The code ${code} is already in use by another node.`);
        }
        await setDoc(couponRef, couponData);
        await deleteDoc(doc(db, 'coupons', editingCoupon.code));
      } else {
        await setDoc(couponRef, couponData, { merge: true });
      }

      toast({ 
        title: editingCoupon ? "Registry Updated" : "Bounty Provisioned", 
        description: `Code ${code} is now operational.` 
      });
      setIsModalOpen(false);
    } catch (error: any) {
      console.error(error);
      const message = error.message || "Operation failed.";
      toast({ variant: "destructive", title: "Sync Failed", description: message });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCoupon = (code: string, currentState: boolean) => {
    if (!db) return;
    const couponRef = doc(db, 'coupons', code);
    updateDoc(couponRef, { isActive: !currentState });
  };

  const handleDelete = (code: string) => {
    if (!db) return;
    const couponRef = doc(db, 'coupons', code);
    deleteDoc(couponRef);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-1">
          <h2 className="text-4xl font-black font-headline uppercase tracking-tighter italic">Offer <span className="text-primary">Engine</span></h2>
          <p className="text-muted-foreground text-sm font-medium tracking-tight">Provision promotional codes and scale your growth velocity.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="h-16 px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-3 bg-primary text-white shadow-3xl hover:scale-[1.02] transition-all w-full md:w-auto">
          Add Coupon +
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-40 text-center">
            <Loader2 className="animate-spin w-12 h-12 text-primary opacity-20 mx-auto mb-6" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Syncing Growth Nodes...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-white dark:bg-zinc-900 rounded-[4rem] border-2 border-dashed flex flex-col items-center justify-center gap-6 opacity-30">
            <TicketPercent className="w-20 h-20" />
            <h3 className="text-2xl font-black uppercase tracking-widest">No Active Bounties</h3>
          </div>
        ) : coupons.map((coupon) => (
          <Card key={coupon.code} className={cn(
            "rounded-[3rem] border-none shadow-xl overflow-hidden transition-all group hover:shadow-2xl relative bg-white dark:bg-zinc-900",
            !coupon.isActive && "grayscale opacity-50"
          )}>
            <div className={cn(
              "p-8 flex justify-between items-center text-white relative overflow-hidden",
              coupon.isActive ? "bg-orange-gradient" : "bg-zinc-700"
            )}>
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10">
                 <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-70 mb-1">Code Identity</p>
                 <h4 className="font-black font-mono text-3xl tracking-tighter italic">{coupon.code}</h4>
              </div>
              <Badge className="bg-white/20 border-none font-black text-[10px] uppercase px-4 py-1.5 rounded-full tracking-widest backdrop-blur-md relative z-10">
                {coupon.discount} {coupon.type === 'percent' ? '%' : '₹'} OFF
              </Badge>
            </div>
            
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground italic leading-relaxed">"{coupon.description}"</p>
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border">
                      <p className="text-[7px] font-black uppercase opacity-40 mb-1">Threshold</p>
                      <p className="text-xs font-black">Min ₹{coupon.minOrderValue || 0}</p>
                   </div>
                   <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border">
                      <p className="text-[7px] font-black uppercase opacity-40 mb-1">Redemptions</p>
                      <p className="text-xs font-black">{coupon.usageCount || 0} / {coupon.usageLimit > 0 ? coupon.usageLimit : '∞'}</p>
                   </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-6 border-t border-dashed">
                <div className="flex items-center gap-4">
                   <Switch checked={coupon.isActive} onCheckedChange={() => toggleCoupon(coupon.code, coupon.isActive)} />
                   <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">
                     {coupon.isActive ? 'Active' : 'Dormant'}
                   </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl bg-secondary/50 border-none hover:bg-primary hover:text-white transition-all text-primary" onClick={() => handleOpenModal(coupon)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl bg-rose-50 border-none hover:bg-rose-600 hover:text-white transition-all text-rose-600" onClick={() => handleDelete(coupon.code)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && setIsModalOpen(false)}>
        <DialogContent className="max-w-2xl rounded-[3.5rem] p-0 overflow-hidden border-none shadow-3xl bg-white dark:bg-zinc-950">
          <div className="p-10 bg-primary text-white shrink-0 relative overflow-hidden">
             <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
             <DialogHeader className="relative z-10 flex flex-row justify-between items-center pr-12">
                <div>
                  <DialogTitle className="text-4xl font-black font-headline uppercase tracking-tighter leading-none italic">
                    {editingCoupon ? 'Modify' : 'Provision'} <span className="opacity-80">Bounty</span>
                  </DialogTitle>
                  <DialogDescription className="text-white/70 font-medium text-xs uppercase tracking-widest mt-2">
                    {editingCoupon ? 'Syncing Profile Updates' : 'New Growth Node Entry'}
                  </DialogDescription>
                </div>
             </DialogHeader>
          </div>

          <div className="p-10 space-y-10 max-h-[60vh] overflow-y-auto scrollbar-hide">
            <div className="grid md:grid-cols-2 gap-10">
               <div className="space-y-8">
                  <h5 className="text-[10px] font-black uppercase text-primary tracking-[0.4em] border-b pb-2">Manifest Identity</h5>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Bounty Code</Label>
                    <Input 
                      placeholder="E.G. FESTIVE50" 
                      value={formData.code} 
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      className="h-14 rounded-2xl border-none bg-secondary/30 dark:bg-zinc-800 font-mono font-black text-xl px-6"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Incentive Type</Label>
                    <Select value={formData.type} onValueChange={(v: any) => setFormData({...formData, type: v})}>
                       <SelectTrigger className="h-14 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-bold px-6">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="rounded-xl">
                          <SelectItem value="percent" className="font-bold">Percentage (%)</SelectItem>
                          <SelectItem value="flat" className="font-bold">Flat Unit (₹)</SelectItem>
                       </SelectContent>
                    </Select>
                  </div>
               </div>

               <div className="space-y-8">
                  <h5 className="text-[10px] font-black uppercase text-primary tracking-[0.4em] border-b pb-2">Operational Bounds</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Discount Val</Label>
                      <Input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} className="h-14 rounded-2xl border-none bg-secondary/30 dark:bg-zinc-800 border-none font-black px-6" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Min. Basket (₹)</Label>
                      <Input type="number" value={formData.minOrderValue} onChange={e => setFormData({...formData, minOrderValue: e.target.value})} className="h-14 rounded-2xl border-none bg-secondary/30 dark:bg-zinc-800 border-none font-black px-6" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Expiration Node</Label>
                      <Input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="h-14 rounded-2xl border-none bg-secondary/30 dark:bg-zinc-800 border-none font-bold px-6" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Usage Limit (0=∞)</Label>
                      <Input type="number" value={formData.usageLimit} onChange={e => setFormData({...formData, usageLimit: e.target.value})} className="h-14 rounded-2xl border-none bg-secondary/30 dark:bg-zinc-800 border-none font-black px-6" />
                    </div>
                  </div>
               </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Public Description</Label>
                <Input 
                  placeholder="Student Special Offer" 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="h-14 rounded-2xl border-none bg-secondary/30 dark:bg-zinc-800 font-bold px-6"
                />
              </div>
              <div className="flex items-center justify-between p-6 bg-secondary/30 dark:bg-zinc-800 rounded-[1.5rem]">
                 <div className="flex gap-4 items-center">
                    <CheckCircle2 className={cn("w-5 h-5", formData.isActive ? "text-emerald-500" : "text-zinc-400")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Global Availability Status</span>
                 </div>
                 <Switch checked={formData.isActive} onCheckedChange={(v) => setFormData({...formData, isActive: v})} />
              </div>
            </div>
          </div>

          <DialogFooter className="p-10 bg-secondary/30 flex gap-4">
             <Button variant="outline" className="h-16 flex-1 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest border-2" onClick={() => setIsModalOpen(false)}>Close</Button>
             <Button className="h-16 flex-1 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest bg-primary text-white shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-all" onClick={handleSave} disabled={submitting}>
               {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : 'Save'}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
