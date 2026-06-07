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
  BellRing, Globe
} from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const StoreSettings = () => {
  const db = useFirestore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [origin, setOrigin] = useState('');
  const [settings, setSettings] = useState({
    // Store Status
    isOpen: true,
    deliveryActive: true,
    codEnabled: true,
    onlinePayEnabled: true,
    
    // Store Identity
    storeName: 'Ezzy Bites',
    contactNumber: '8639366800',
    supportEmail: 'support@ezzybites.com',
    address: 'Near Anurag University, Pocharam, Hyderabad',
    deliveryRadius: 3,

    // Logistics
    openTime: '08:00',
    closeTime: '22:00',
    minOrderValue: 0,
    deliveryCharge: 40,
    freeDeliveryThreshold: 149,

    // Notifications
    newOrderAlert: true,
    statusUpdates: true
  });

  useEffect(() => {
    setOrigin(typeof window !== 'undefined' ? window.location.origin : '');
    if (!db) return;
    const fetchSettings = async () => {
      const docRef = doc(db, 'settings', 'store_config');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setSettings(prev => ({ 
          ...prev, 
          ...data,
          storeName: data.storeName || '',
          contactNumber: data.contactNumber || '',
          supportEmail: data.supportEmail || '',
          address: data.address || '',
          openTime: data.openTime || '08:00',
          closeTime: data.closeTime || '22:00'
        }));
      }
      setLoading(false);
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
        toast({ title: "Configuration Updated", description: "Operational parameters synced live." });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: settingsRef.path,
          operation: 'write',
          requestResourceData: updateData
        }));
      })
      .finally(() => setSaving(false));
  };

  const menuUrl = `${origin}/menu`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(menuUrl)}`;

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto w-10 h-10 text-primary" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black font-headline uppercase tracking-tighter">System <span className="text-primary italic">Config</span></h2>
          <p className="text-muted-foreground text-sm font-medium">Global operational parameters and identity management.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="rounded-2xl h-14 px-10 font-black uppercase tracking-widest text-[10px] gap-3 bg-primary text-white shadow-xl shadow-primary/20">
          {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
          Apply Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-white dark:bg-zinc-900 p-1 rounded-2xl border mb-8 flex w-fit shadow-sm overflow-x-auto scrollbar-hide">
           <TabsTrigger value="general" className="px-8 py-3 rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest"><Store className="w-4 h-4" /> Restaurant</TabsTrigger>
           <TabsTrigger value="order" className="px-8 py-3 rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest"><CreditCard className="w-4 h-4" /> Order Logic</TabsTrigger>
           <TabsTrigger value="digital" className="px-8 py-3 rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest"><QrCode className="w-4 h-4" /> Digital Menu</TabsTrigger>
           <TabsTrigger value="alerts" className="px-8 py-3 rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest"><BellRing className="w-4 h-4" /> Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-8">
           <div className="grid md:grid-cols-2 gap-8">
             <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900">
                <CardHeader className="p-8 pb-4"><CardTitle className="text-lg font-black uppercase tracking-widest">Store Identity</CardTitle></CardHeader>
                <CardContent className="p-8 space-y-6">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Restaurant Name</Label>
                      <Input value={settings.storeName || ''} onChange={e => setSettings({...settings, storeName: e.target.value})} className="h-12 rounded-xl bg-secondary/30 border-none font-bold" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Contact No.</Label>
                        <Input value={settings.contactNumber || ''} onChange={e => setSettings({...settings, contactNumber: e.target.value})} className="h-12 rounded-xl bg-secondary/30 border-none font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Support Email</Label>
                        <Input value={settings.supportEmail || ''} onChange={e => setSettings({...settings, supportEmail: e.target.value})} className="h-12 rounded-xl bg-secondary/30 border-none font-bold" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Physical Address</Label>
                      <Input value={settings.address || ''} onChange={e => setSettings({...settings, address: e.target.value})} className="h-12 rounded-xl bg-secondary/30 border-none font-bold" />
                   </div>
                </CardContent>
             </Card>

             <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900">
                <CardHeader className="p-8 pb-4"><CardTitle className="text-lg font-black uppercase tracking-widest">Timing & Range</CardTitle></CardHeader>
                <CardContent className="p-8 space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Opening Time</Label>
                        <Input type="time" value={settings.openTime || '08:00'} onChange={e => setSettings({...settings, openTime: e.target.value})} className="h-12 rounded-xl bg-secondary/30 border-none font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Closing Time</Label>
                        <Input type="time" value={settings.closeTime || '22:00'} onChange={e => setSettings({...settings, closeTime: e.target.value})} className="h-12 rounded-xl bg-secondary/30 border-none font-bold" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Delivery Radius (KM)</Label>
                      <Input type="number" value={settings.deliveryRadius || 0} onChange={e => setSettings({...settings, deliveryRadius: Number(e.target.value)})} className="h-12 rounded-xl bg-secondary/30 border-none font-bold" />
                   </div>
                   <div className="flex items-center justify-between p-5 bg-primary/5 rounded-2xl border border-primary/10">
                      <div className="space-y-1">
                        <p className="font-black text-[11px] uppercase">Accepting Orders</p>
                        <p className="text-[9px] font-medium opacity-60">Global override for order intake</p>
                      </div>
                      <Switch checked={settings.isOpen} onCheckedChange={(v) => setSettings({...settings, isOpen: v})} />
                   </div>
                </CardContent>
             </Card>
           </div>
        </TabsContent>

        <TabsContent value="order" className="space-y-8">
           <div className="grid md:grid-cols-2 gap-8">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900">
                <CardHeader className="p-8 pb-4"><CardTitle className="text-lg font-black uppercase tracking-widest">Financial Logic</CardTitle></CardHeader>
                <CardContent className="p-8 space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Standard Delivery Fee</Label>
                        <Input type="number" value={settings.deliveryCharge || 0} onChange={e => setSettings({...settings, deliveryCharge: Number(e.target.value)})} className="h-12 rounded-xl bg-secondary/30 border-none font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Free Delivery @</Label>
                        <Input type="number" value={settings.freeDeliveryThreshold || 0} onChange={e => setSettings({...settings, freeDeliveryThreshold: Number(e.target.value)})} className="h-12 rounded-xl bg-secondary/30 border-none font-bold" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Minimum Order Amount (₹)</Label>
                      <Input type="number" value={settings.minOrderValue || 0} onChange={e => setSettings({...settings, minOrderValue: Number(e.target.value)})} className="h-12 rounded-xl bg-secondary/30 border-none font-bold" />
                   </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900">
                <CardHeader className="p-8 pb-4"><CardTitle className="text-lg font-black uppercase tracking-widest">Payment Methods</CardTitle></CardHeader>
                <CardContent className="p-8 space-y-4">
                   <div className="flex items-center justify-between p-5 bg-secondary/30 dark:bg-zinc-800 rounded-3xl">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white dark:bg-zinc-700 rounded-xl flex items-center justify-center text-primary shadow-sm"><Truck className="w-5 h-5" /></div>
                         <p className="font-black text-[11px] uppercase">Cash on Delivery</p>
                      </div>
                      <Switch checked={settings.codEnabled} onCheckedChange={(v) => setSettings({...settings, codEnabled: v})} />
                   </div>
                   <div className="flex items-center justify-between p-5 bg-secondary/30 dark:bg-zinc-800 rounded-3xl">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white dark:bg-zinc-700 rounded-xl flex items-center justify-center text-blue-500 shadow-sm"><Globe className="w-5 h-5" /></div>
                         <p className="font-black text-[11px] uppercase">Online Payments</p>
                      </div>
                      <Switch checked={settings.onlinePayEnabled} onCheckedChange={(v) => setSettings({...settings, onlinePayEnabled: v})} />
                   </div>
                </CardContent>
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="digital" className="space-y-8">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 overflow-hidden max-w-2xl mx-auto">
            <CardHeader className="p-10 pb-4 text-center">
              <CardTitle className="text-2xl font-black font-headline uppercase tracking-tighter">Menu QR System</CardTitle>
            </CardHeader>
            <CardContent className="p-10 flex flex-col items-center text-center space-y-8">
              <div className="bg-white p-8 rounded-[3rem] shadow-3xl border-8 border-secondary/50">
                <img src={qrCodeUrl} alt="Menu QR Code" className="w-64 h-64" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black uppercase tracking-tight">Public Menu Interface</p>
                <code className="text-[10px] font-mono font-bold text-muted-foreground bg-secondary/50 p-3 rounded-xl block w-full max-w-sm truncate">{menuUrl}</code>
              </div>
              <div className="flex gap-4 w-full">
                <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 border-2" onClick={() => window.open(qrCodeUrl, '_blank')}><Download className="w-4 h-4" /> Save QR</Button>
                <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 border-2" onClick={() => window.open(menuUrl, '_blank')}><ExternalLink className="w-4 h-4" /> Test Link</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-8">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 max-w-xl mx-auto">
             <CardHeader className="p-8 pb-4"><CardTitle className="text-lg font-black uppercase tracking-widest">Notification Preferences</CardTitle></CardHeader>
             <CardContent className="p-8 space-y-4">
                <div className="flex items-center justify-between p-6 bg-secondary/30 dark:bg-zinc-800 rounded-3xl">
                   <div className="space-y-1">
                      <p className="font-black text-[11px] uppercase">New Order Triggers</p>
                      <p className="text-[9px] font-medium opacity-60">Push/Sound alerts for incoming orders</p>
                   </div>
                   <Switch checked={settings.newOrderAlert} onCheckedChange={(v) => setSettings({...settings, newOrderAlert: v})} />
                </div>
                <div className="flex items-center justify-between p-6 bg-secondary/30 dark:bg-zinc-800 rounded-3xl">
                   <div className="space-y-1">
                      <p className="font-black text-[11px] uppercase">Customer Tracking</p>
                      <p className="text-[9px] font-medium opacity-60">Automated status updates for users</p>
                   </div>
                   <Switch checked={settings.statusUpdates} onCheckedChange={(v) => setSettings({...settings, statusUpdates: v})} />
                </div>
             </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-[2rem] border border-green-100 dark:border-green-800 flex items-center gap-4 mt-8">
         <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-green-600 shadow-sm shrink-0">
           <ShieldCheck className="w-6 h-6" />
         </div>
         <p className="text-[11px] font-bold text-green-700 dark:text-green-400 leading-relaxed uppercase">
           Verified configuration. All operational parameters are synchronized with high-availability Firebase cluster.
         </p>
      </div>
    </div>
  );
};
