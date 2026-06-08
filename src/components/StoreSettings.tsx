"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Clock, Store, Save, Loader2, 
  ShieldCheck, QrCode, Download, 
  ExternalLink, Phone, Mail, 
  MapPin, CreditCard, Truck,
  BellRing, Globe, Settings2
} from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const StoreSettings = () => {
  const db = useFirestore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [origin, setOrigin] = useState('');
  
  const [settings, setSettings] = useState({
    isOpen: true,
    deliveryActive: true,
    codEnabled: true,
    onlinePayEnabled: true,
    storeName: 'Ezzy Bites',
    contactNumber: '8639366800',
    supportEmail: 'support@ezzybites.com',
    address: 'Near Anurag University, Pocharam, Hyderabad',
    deliveryRadius: 3,
    openTime: '08:00',
    closeTime: '22:00',
    minOrderValue: 0,
    deliveryCharge: 40,
    freeDeliveryThreshold: 149,
    newOrderAlert: true,
    statusUpdates: true
  });

  useEffect(() => {
    setOrigin(typeof window !== 'undefined' ? window.location.origin : '');
    if (!db) return;
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'store_config');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setSettings(prev => ({ ...prev, ...snap.data() }));
        }
      } catch (e) {
        console.error("Failed to load settings:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [db]);

  const handleSave = async () => {
    if (!db) return;
    setSaving(true);
    const settingsRef = doc(db, 'settings', 'store_config');
    const updateData = {
      ...settings,
      updatedAt: serverTimestamp()
    };

    setDoc(settingsRef, updateData, { merge: true })
      .then(() => {
        toast({ title: "Configuration Updated", description: "Operational parameters synced across all nodes." });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: settingsRef.path,
          operation: 'write',
          requestResourceData: updateData
        } satisfies SecurityRuleContext));
      })
      .finally(() => setSaving(false));
  };

  const menuUrl = `${origin}/menu`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(menuUrl)}`;

  if (loading) return (
    <div className="p-40 text-center space-y-6">
      <div className="relative inline-block">
         <div className="w-16 h-16 bg-primary/10 rounded-2xl animate-pulse" />
         <Loader2 className="animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 animate-pulse">Establishing Core Connection...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black font-headline uppercase tracking-tighter">Global <span className="text-primary italic">Config</span></h2>
          <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-lg">Central control for timing, logistics, and identity parameters across the Ezzy ecosystem.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="rounded-2xl h-16 px-12 font-black uppercase tracking-widest text-[10px] gap-3 bg-primary text-white shadow-2xl shadow-primary/30">
          {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
          Commit Settings
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-white dark:bg-zinc-900 p-1.5 rounded-[2rem] border mb-10 flex w-full lg:w-fit shadow-sm overflow-x-auto scrollbar-hide">
           <TabsTrigger value="general" className="px-10 py-3.5 rounded-[1.5rem] gap-2 font-black uppercase text-[9px] tracking-[0.2em]"><Store className="w-4 h-4" /> Identity</TabsTrigger>
           <TabsTrigger value="order" className="px-10 py-3.5 rounded-[1.5rem] gap-2 font-black uppercase text-[9px] tracking-[0.2em]"><Settings2 className="w-4 h-4" /> Logistics</TabsTrigger>
           <TabsTrigger value="digital" className="px-10 py-3.5 rounded-[1.5rem] gap-2 font-black uppercase text-[9px] tracking-[0.2em]"><QrCode className="w-4 h-4" /> Marketing</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-8 animate-in slide-in-from-bottom-2">
           <div className="grid md:grid-cols-2 gap-10">
             <Card className="rounded-[3rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-10">
                <CardHeader className="px-0 pt-0 pb-8 border-b border-dashed mb-8"><CardTitle className="text-xl font-black font-headline uppercase tracking-tight">Public Brand Profile</CardTitle></CardHeader>
                <div className="space-y-8">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Trading Name</Label>
                      <Input value={settings.storeName} onChange={e => setSettings({...settings, storeName: e.target.value})} className="h-14 rounded-2xl bg-secondary/30 border-none font-black text-base" />
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Operational Phone</Label>
                        <Input value={settings.contactNumber} onChange={e => setSettings({...settings, contactNumber: e.target.value})} className="h-14 rounded-2xl bg-secondary/30 border-none font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Support Channel</Label>
                        <Input value={settings.supportEmail} onChange={e => setSettings({...settings, supportEmail: e.target.value})} className="h-14 rounded-2xl bg-secondary/30 border-none font-bold" />
                      </div>
                   </div>
                </div>
             </Card>

             <Card className="rounded-[3rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-10">
                <CardHeader className="px-0 pt-0 pb-8 border-b border-dashed mb-8"><CardTitle className="text-xl font-black font-headline uppercase tracking-tight">Availability Toggles</CardTitle></CardHeader>
                <div className="space-y-6">
                   <div className="flex items-center justify-between p-6 bg-primary/5 rounded-[2rem] border border-primary/20 group">
                      <div className="space-y-1">
                        <p className="font-black text-[12px] uppercase">Accepting Orders</p>
                        <p className="text-[9px] font-medium opacity-50 uppercase tracking-widest">Global override for store presence</p>
                      </div>
                      <Switch checked={settings.isOpen} onCheckedChange={(v) => setSettings({...settings, isOpen: v})} />
                   </div>
                   <div className="flex items-center justify-between p-6 bg-secondary/30 dark:bg-zinc-800 rounded-[2rem] group">
                      <div className="space-y-1">
                        <p className="font-black text-[12px] uppercase">Fleet Status</p>
                        <p className="text-[9px] font-medium opacity-50 uppercase tracking-widest">Toggle delivery logic availability</p>
                      </div>
                      <Switch checked={settings.deliveryActive} onCheckedChange={(v) => setSettings({...settings, deliveryActive: v})} />
                   </div>
                </div>
             </Card>
           </div>
        </TabsContent>

        <TabsContent value="order" className="space-y-8 animate-in slide-in-from-bottom-2">
           <Card className="rounded-[3rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-10 max-w-4xl">
              <div className="grid md:grid-cols-2 gap-12">
                 <div className="space-y-8">
                    <h5 className="text-[10px] font-black uppercase text-primary tracking-[0.3em] border-b pb-2">Financial Bounds</h5>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase opacity-40">Min. Cart Value</Label>
                          <Input type="number" value={settings.minOrderValue} onChange={e => setSettings({...settings, minOrderValue: Number(e.target.value)})} className="h-14 rounded-2xl bg-secondary/30 border-none font-black" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase opacity-40">Base Delivery Fee</Label>
                          <Input type="number" value={settings.deliveryCharge} onChange={e => setSettings({...settings, deliveryCharge: Number(e.target.value)})} className="h-14 rounded-2xl bg-secondary/30 border-none font-black" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase opacity-40">Free Shipping Threshold (₹)</Label>
                       <Input type="number" value={settings.freeDeliveryThreshold} onChange={e => setSettings({...settings, freeDeliveryThreshold: Number(e.target.value)})} className="h-14 rounded-2xl bg-secondary/30 border-none font-black" />
                    </div>
                 </div>
                 <div className="space-y-8">
                    <h5 className="text-[10px] font-black uppercase text-primary tracking-[0.3em] border-b pb-2">Settlement Engines</h5>
                    <div className="space-y-4">
                       <div className="flex items-center justify-between p-5 bg-secondary/30 dark:bg-zinc-800 rounded-3xl">
                          <div className="flex items-center gap-4 text-primary">
                             <Truck className="w-5 h-5" />
                             <span className="font-black text-[11px] uppercase">Pay On Arrival (COD)</span>
                          </div>
                          <Switch checked={settings.codEnabled} onCheckedChange={(v) => setSettings({...settings, codEnabled: v})} />
                       </div>
                       <div className="flex items-center justify-between p-5 bg-secondary/30 dark:bg-zinc-800 rounded-3xl">
                          <div className="flex items-center gap-4 text-blue-500">
                             <Globe className="w-5 h-5" />
                             <span className="font-black text-[11px] uppercase">Digital UPI/Card Gateway</span>
                          </div>
                          <Switch checked={settings.onlinePayEnabled} onCheckedChange={(v) => setSettings({...settings, onlinePayEnabled: v})} />
                       </div>
                    </div>
                 </div>
              </div>
           </Card>
        </TabsContent>

        <TabsContent value="digital" className="space-y-8 animate-in slide-in-from-bottom-2">
          <Card className="rounded-[4rem] border-none shadow-3xl bg-white dark:bg-zinc-900 overflow-hidden max-w-2xl mx-auto p-12 flex flex-col items-center text-center space-y-10">
             <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-[4rem] blur-[80px] animate-pulse" />
                <div className="relative bg-white p-10 rounded-[3rem] shadow-2xl border-8 border-secondary">
                   <img src={qrCodeUrl} alt="Store QR" className="w-64 h-64 grayscale group-hover:grayscale-0 transition-all duration-1000" />
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/60 rounded-[2rem] text-white">
                      <Download className="w-12 h-12" />
                   </div>
                </div>
             </div>
             <div className="space-y-4">
                <h3 className="text-3xl font-black font-headline uppercase tracking-tighter">Instant <span className="text-primary italic">Access</span></h3>
                <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-sm">Place this QR on tables or delivery bags to direct customers instantly to the digital menu experience.</p>
                <code className="text-[10px] font-mono font-bold text-primary bg-primary/5 p-4 rounded-2xl block border border-dashed border-primary/20 break-all">{menuUrl}</code>
             </div>
             <div className="flex gap-4 w-full pt-4">
                <Button variant="outline" className="flex-1 h-16 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest gap-2 border-2" onClick={() => window.open(qrCodeUrl, '_blank')}><Download className="w-4 h-4" /> Save Manifest</Button>
                <Button className="flex-1 h-16 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest gap-2 bg-primary shadow-xl shadow-primary/30" onClick={() => window.open(menuUrl, '_blank')}>Launch Menu <ExternalLink className="w-4 h-4" /></Button>
             </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="bg-green-50 dark:bg-green-900/10 p-8 rounded-[3rem] border-2 border-dashed border-green-200 dark:border-green-800 flex items-center gap-6 mt-12">
         <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-[1.5rem] flex items-center justify-center text-green-600 shadow-xl shrink-0">
           <ShieldCheck className="w-8 h-8" />
         </div>
         <div className="space-y-1">
            <p className="text-[10px] font-black text-green-700 dark:text-green-400 uppercase tracking-widest">Integrity Verified</p>
            <p className="text-sm font-medium text-green-600 dark:text-green-500 leading-relaxed italic">
              All settings are provisioned via high-availability Firebase clusters. Updates are broadcasted to all customer clients in real-time (~200ms latency).
            </p>
         </div>
      </div>
    </div>
  );
};
