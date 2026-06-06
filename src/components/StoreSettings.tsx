"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Store, Save, Loader2, ShieldCheck, QrCode, Download, ExternalLink } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const StoreSettings = () => {
  const db = useFirestore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [origin, setOrigin] = useState('');
  const [settings, setSettings] = useState({
    isOpen: true,
    deliveryActive: true,
    openTime: '08:00',
    closeTime: '22:00',
    minOrderValue: 0
  });

  useEffect(() => {
    setOrigin(window.location.origin);
    if (!db) return;
    const fetchSettings = async () => {
      const docRef = doc(db, 'settings', 'store_config');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setSettings(snap.data() as any);
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
        toast({ title: "Settings Saved", description: "Operational status updated live." });
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
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black font-headline uppercase tracking-tighter flex items-center gap-3">
                <Store className="w-6 h-6 text-primary" /> Live Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between p-6 bg-secondary/30 dark:bg-zinc-800 rounded-3xl">
                <div className="space-y-1">
                  <p className="font-black text-sm uppercase">Accepting Orders</p>
                  <p className="text-[10px] font-medium opacity-60">Turn off to temporarily stop new orders</p>
                </div>
                <Switch checked={settings.isOpen} onCheckedChange={(v) => setSettings({...settings, isOpen: v})} />
              </div>
              <div className="flex items-center justify-between p-6 bg-secondary/30 dark:bg-zinc-800 rounded-3xl">
                <div className="space-y-1">
                  <p className="font-black text-sm uppercase">Delivery Service</p>
                  <p className="text-[10px] font-medium opacity-60">Enable/Disable delivery service</p>
                </div>
                <Switch checked={settings.deliveryActive} onCheckedChange={(v) => setSettings({...settings, deliveryActive: v})} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black font-headline uppercase tracking-tighter flex items-center gap-3">
                <Clock className="w-6 h-6 text-primary" /> Store Timings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest opacity-40">Opening Time</Label>
                  <Input type="time" value={settings.openTime} onChange={e => setSettings({...settings, openTime: e.target.value})} className="h-12 rounded-xl bg-secondary/30 border-none font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest opacity-40">Closing Time</Label>
                  <Input type="time" value={settings.closeTime} onChange={e => setSettings({...settings, closeTime: e.target.value})} className="h-12 rounded-xl bg-secondary/30 border-none font-bold" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest opacity-40">Min. Order Value (₹)</Label>
                <Input type="number" value={settings.minOrderValue} onChange={e => setSettings({...settings, minOrderValue: Number(e.target.value)})} className="h-12 rounded-xl bg-secondary/30 border-none font-bold" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black font-headline uppercase tracking-tighter flex items-center gap-3">
                <QrCode className="w-6 h-6 text-primary" /> Digital Menu QR
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
              <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-primary/5 border-8 border-secondary/50">
                <img 
                  src={qrCodeUrl} 
                  alt="Menu QR Code" 
                  className="w-48 h-48 md:w-56 md:h-56"
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-black uppercase tracking-tight">Your Custom Menu Link</p>
                <p className="text-[10px] font-mono font-bold text-muted-foreground bg-secondary/50 p-2 rounded-lg truncate w-full max-w-[280px]">
                  {menuUrl}
                </p>
              </div>

              <div className="flex gap-3 w-full">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl h-12 font-black uppercase text-[9px] tracking-widest gap-2 border-2"
                  onClick={() => window.open(qrCodeUrl, '_blank')}
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl h-12 font-black uppercase text-[9px] tracking-widest gap-2 border-2"
                  onClick={() => window.open(menuUrl, '_blank')}
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Test Link
                </Button>
              </div>

              <div className="p-4 bg-primary/5 rounded-2xl border border-dashed border-primary/20">
                <p className="text-[9px] font-bold text-primary uppercase leading-relaxed">
                  Tip: Print this QR and place it on your tables to allow customers to order directly from their phones.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 border-2 border-dashed border-muted">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-sm uppercase">System Verified</h4>
                <p className="text-xs text-muted-foreground mt-1">Your operational parameters are synchronized with the cloud.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={saving} className="rounded-2xl h-16 px-12 font-black uppercase tracking-widest text-[11px] gap-3 bg-primary shadow-xl shadow-primary/20">
          {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
          Update Operational Status
        </Button>
      </div>
    </div>
  );
};
