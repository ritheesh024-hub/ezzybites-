'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Send, 
  Users, 
  Loader2,
  TicketPercent,
  Megaphone,
  History,
  Smartphone
} from 'lucide-react';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, orderBy, limit, addDoc, serverTimestamp, writeBatch, doc, getDocs } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const AdminNotificationManager = () => {
  const db = useFirestore();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetAudience: 'all',
    type: 'promo' as 'promo' | 'system',
    link: '/menu'
  });

  const logsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(20));
  }, [db]);

  const { data: logs, loading: logsLoading } = useCollection<any>(logsQuery);

  const handleSendBroadcast = async () => {
    if (!db || !user || !formData.title || !formData.message) {
      toast({ variant: "destructive", title: "Incomplete Details", description: "Title and Message are required." });
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch all users to distribute the notification
      const usersSnap = await getDocs(collection(db, 'users'));
      const batch = writeBatch(db);

      // 2. Create the master log record
      const notificationData = {
        title: formData.title,
        message: formData.message,
        targetAudience: formData.targetAudience,
        type: formData.type,
        link: formData.link,
        isActive: true,
        createdBy: user.uid,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'notifications'), notificationData);

      // 3. Populate user inboxes (standardized subcollection path)
      usersSnap.docs.forEach(userDoc => {
        const userNotifRef = doc(collection(db, 'user_notifications', userDoc.id, 'messages'));
        batch.set(userNotifRef, {
          title: formData.title,
          message: formData.message,
          type: formData.type,
          link: formData.link,
          read: false,
          createdAt: serverTimestamp()
        });
      });

      await batch.commit();
      
      toast({ title: "Broadcast Sent! 🚀", description: `Delivered to ${usersSnap.size} active users.` });
      setFormData({ title: '', message: '', targetAudience: 'all', type: 'promo', link: '/menu' });
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Transmission Failed", description: e.message });
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'notifications',
        operation: 'create',
      } as any));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-1">
          <h2 className="text-4xl font-black font-headline uppercase tracking-tighter italic">Broadcast <span className="text-primary">Engine</span></h2>
          <p className="text-muted-foreground text-sm font-medium tracking-tight">Send high-priority in-app notifications to your customer base.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <Card className="lg:col-span-2 rounded-[3rem] border-none shadow-3xl bg-white dark:bg-zinc-900 p-10 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <Megaphone className="w-64 h-64 rotate-12" />
          </div>
          
          <CardHeader className="px-0 pt-0 pb-10 border-b border-dashed mb-10">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl"><Bell className="w-6 h-6" /></div>
               <CardTitle className="text-xl font-black font-headline uppercase tracking-tight">Draft Transmission</CardTitle>
             </div>
          </CardHeader>

          <div className="space-y-8 relative z-10">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Message Header</Label>
                <Input 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="h-14 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-black text-base" 
                  placeholder="e.g. 50% OFF Midnight Biryani!"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Call to Action (Link)</Label>
                <Input 
                  value={formData.link} 
                  onChange={e => setFormData({...formData, link: e.target.value})}
                  className="h-14 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-bold" 
                  placeholder="/menu"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Payload Content</Label>
              <Textarea 
                value={formData.message} 
                onChange={e => setFormData({...formData, message: e.target.value})}
                className="min-h-[140px] rounded-[2rem] bg-secondary/30 dark:bg-zinc-800 border-none px-6 py-6 font-medium text-lg leading-relaxed" 
                placeholder="Compose your high-converting copy here..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="flex-1 flex gap-2">
                 <Button 
                   onClick={() => setFormData({...formData, type: 'promo'})}
                   variant={formData.type === 'promo' ? 'default' : 'outline'}
                   className={cn("flex-1 h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-3 border-2", formData.type === 'promo' ? "bg-emerald-600 hover:bg-emerald-500" : "")}
                 >
                   <TicketPercent className="w-5 h-5" /> Marketing
                 </Button>
                 <Button 
                   onClick={() => setFormData({...formData, type: 'system'})}
                   variant={formData.type === 'system' ? 'default' : 'outline'}
                   className={cn("flex-1 h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-3 border-2", formData.type === 'system' ? "bg-blue-600 hover:bg-blue-500" : "")}
                 >
                   <Smartphone className="w-5 h-5" /> System
                 </Button>
              </div>
              <Button 
                onClick={handleSendBroadcast}
                disabled={loading}
                className="flex-1 h-16 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] bg-primary text-white shadow-2xl shadow-primary/30 gap-3"
              >
                {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <><Send className="w-5 h-5" /> Execute Broadcast</>}
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-8">
           <Card className="rounded-[3rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-8">
              <CardHeader className="px-0 pt-0 pb-6 border-b border-dashed mb-6 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                  <History className="w-4 h-4 text-primary" /> Global Logs
                </CardTitle>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </CardHeader>
              <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-hide">
                {logsLoading ? (
                  <div className="py-20 text-center opacity-10"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></div>
                ) : logs.length === 0 ? (
                   <div className="py-20 text-center opacity-20">
                     <Bell className="w-10 h-10 mx-auto mb-2" />
                     <p className="text-[10px] font-black uppercase tracking-widest">No signals recorded</p>
                   </div>
                ) : logs.map((log: any, i: number) => (
                  <div key={i} className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border group hover:border-primary/20 transition-all">
                     <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase text-primary truncate max-w-[150px]">{log.title}</span>
                        <span className="text-[7px] font-black uppercase opacity-30">{log.createdAt?.toDate ? format(log.createdAt.toDate(), 'MMM dd, p') : 'Pending'}</span>
                     </div>
                     <p className="text-[9px] font-medium text-muted-foreground line-clamp-2 leading-relaxed mb-4">"{log.message}"</p>
                     <div className="flex items-center justify-between pt-3 border-t border-dashed">
                        <div className="flex items-center gap-1.5 text-[8px] font-black uppercase opacity-60">
                           <Users className="w-3 h-3" /> Audience: {log.targetAudience}
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-600 border-none text-[6px] font-black px-1.5 h-4">Deployed</Badge>
                     </div>
                  </div>
                ))}
              </div>
           </Card>

           <Card className="rounded-[2.5rem] border-none shadow-xl bg-orange-gradient text-white p-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 space-y-6">
                 <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                   <Megaphone className="w-6 h-6" />
                 </div>
                 <div className="space-y-1">
                   <h4 className="text-xl font-black uppercase tracking-tighter leading-none italic">Growth Tactics</h4>
                   <p className="text-[10px] font-medium text-white/70 leading-relaxed uppercase tracking-widest">In-app signals drive <span className="text-white font-black">40% more</span> instant checkouts than passive banners.</p>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};