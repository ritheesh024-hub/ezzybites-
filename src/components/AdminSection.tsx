
"use client"
import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Package, Clock, ChefHat, 
  Receipt, ShoppingBag, 
  Volume2, VolumeX, BellRing,
  MapPin, User,
  Users, UserPlus, Globe, Utensils,
  TicketPercent, BarChart3, Fingerprint,
  LayoutGrid,
  Settings2,
  Ban,
  IndianRupee,
  ShieldCheck,
  ChevronRight,
  Target,
  ArrowUpRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, limit, doc, updateDoc, orderBy, increment, serverTimestamp } from 'firebase/firestore';
import { DashboardAnalysis } from './DashboardAnalysis';
import { BillingSystem } from './BillingSystem';
import { StoreSettings } from './StoreSettings';
import { NewOrderPopups } from './NewOrderPopups';
import { KitchenSystem } from './KitchenSystem';
import { StaffManagement } from './StaffManagement';
import { CouponManager } from './CouponManager';
import { UserManagement } from './UserManagement';
import { ProductManagement } from './ProductManagement';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/use-sound';
import { StaffRole } from '@/app/admin/dashboard/page';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

interface AdminSectionProps {
  assignedRole: StaffRole;
  activeView: StaffRole;
}

export const AdminSection = ({ assignedRole, activeView }: AdminSectionProps) => {
  const db = useFirestore();
  const { user } = useUser();
  const { playSound, isAdminMuted, toggleAdminMute } = useSound();
  
  const ordersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(500));
  }, [db]);
  const { data: realOrders } = useCollection<any>(ordersQuery);

  const menuQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'products'));
  }, [db]);
  const { data: dbMenu } = useCollection<any>(menuQuery);

  const [selectedOrderForView, setSelectedOrderForView] = useState<any>(null);

  const orderGroups = useMemo(() => {
    const groups = { pending: [] as any[], preparing: [] as any[], completed: [] as any[] };
    if (!realOrders) return groups;
    realOrders.forEach(o => {
      if (o.status === 'Pending') groups.pending.push(o);
      else if (['Confirmed', 'Preparing', 'Out for Delivery'].includes(o.status)) groups.preparing.push(o);
      else if (['Delivered', 'Cancelled'].includes(o.status)) groups.completed.push(o);
    });
    return groups;
  }, [realOrders]);

  const handleUpdateStatus = (id: string, newStatus: string) => {
    if (!db) return;
    const orderRef = doc(db, 'orders', id);
    const updateData: any = { status: newStatus };
    if (newStatus === 'Confirmed') updateData.acceptedAt = serverTimestamp();

    updateDoc(orderRef, updateData)
      .then(() => {
        if (user) {
          const staffRef = doc(db, 'admins', user.uid);
          updateDoc(staffRef, { 'stats.kitchenUpdates': increment(1), 'stats.ordersHandled': increment(1) }).catch(() => {});
        }
        playSound('success');
        toast({ title: `Order ${newStatus}` });
        if (selectedOrderForView?.id === id) setSelectedOrderForView(null);
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: orderRef.path,
          operation: 'update',
          requestResourceData: updateData
        } satisfies SecurityRuleContext));
      });
  };

  const getStatusBadge = (order: any) => {
    const status = order.status;
    switch (status) {
      case 'Delivered': return <Badge className="bg-green-100 text-green-700 border-none px-3 font-black text-[9px] uppercase">Delivered</Badge>;
      case 'Cancelled': return <Badge className="bg-red-100 text-red-700 border-none px-3 font-black text-[9px] uppercase">Cancelled</Badge>;
      case 'Pending': return <Badge className="bg-blue-100 text-blue-700 border-none px-3 font-black text-[9px] uppercase">New</Badge>;
      case 'Confirmed': return <Badge className="bg-cyan-100 text-cyan-700 border-none px-3 font-black text-[9px] uppercase">Accepted</Badge>;
      case 'Preparing': return <Badge className="bg-orange-100 text-orange-700 border-none px-3 font-black text-[9px] uppercase">Cooking</Badge>;
      case 'Out for Delivery': return <Badge className="bg-purple-100 text-purple-700 border-none px-3 font-black text-[9px] uppercase">Transit</Badge>;
      default: return <Badge variant="outline" className="px-3 font-black text-[9px] uppercase">{status}</Badge>;
    }
  }

  const availableTabs = useMemo(() => {
    if (activeView === 'kitchen') return ['kitchen'];
    if (activeView === 'cashier') return ['overview', 'billing', 'orders'];
    return ['overview', 'users', 'billing', 'orders', 'products', 'coupons', 'staff', 'settings'];
  }, [activeView]);

  return (
    <section className="bg-zinc-50 dark:bg-zinc-950 min-h-screen pb-20">
      <NewOrderPopups pendingOrders={orderGroups.pending} onViewDetails={(order) => setSelectedOrderForView(order)} onUpdateStatus={handleUpdateStatus} />
      
      <div className="container mx-auto px-4 pt-8">
        <Tabs defaultValue={availableTabs[0]} className="space-y-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <TabsList className="bg-white dark:bg-zinc-900 p-1.5 rounded-full border w-full lg:w-fit flex shadow-sm overflow-x-auto scrollbar-hide">
              {availableTabs.includes('overview') && <TabsTrigger value="overview" className="px-6 py-2.5 font-black uppercase text-[9px] tracking-widest rounded-full gap-2 shrink-0"><BarChart3 className="w-3.5 h-3.5" /> Analytics</TabsTrigger>}
              {availableTabs.includes('users') && <TabsTrigger value="users" className="px-6 py-2.5 font-black uppercase text-[9px] tracking-widest rounded-full gap-2 shrink-0"><Users className="w-3.5 h-3.5" /> Customers</TabsTrigger>}
              {availableTabs.includes('billing') && <TabsTrigger value="billing" className="px-6 py-2.5 font-black uppercase text-[9px] tracking-widest rounded-full gap-2 shrink-0"><Receipt className="w-3.5 h-3.5" /> Counter</TabsTrigger>}
              {availableTabs.includes('kitchen') && <TabsTrigger value="kitchen" className="px-6 py-2.5 font-black uppercase text-[9px] tracking-widest rounded-full gap-2 shrink-0"><ChefHat className="w-3.5 h-3.5" /> Live Kitchen</TabsTrigger>}
              {availableTabs.includes('orders') && (
                <TabsTrigger value="orders" className="px-6 py-2.5 font-black uppercase text-[9px] tracking-widest rounded-full gap-2 relative shrink-0">
                  <ShoppingBag className="w-3.5 h-3.5" /> Orders
                  {orderGroups.pending.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse border-2 border-white dark:border-zinc-900" />}
                </TabsTrigger>
              )}
              {availableTabs.includes('products') && <TabsTrigger value="products" className="px-6 py-2.5 font-black uppercase text-[9px] tracking-widest rounded-full gap-2 shrink-0"><LayoutGrid className="w-3.5 h-3.5" /> Menu</TabsTrigger>}
              {availableTabs.includes('coupons') && <TabsTrigger value="coupons" className="px-6 py-2.5 font-black uppercase text-[9px] tracking-widest rounded-full gap-2 shrink-0"><TicketPercent className="w-3.5 h-3.5" /> Offers</TabsTrigger>}
              {availableTabs.includes('staff') && <TabsTrigger value="staff" className="px-6 py-2.5 font-black uppercase text-[9px] tracking-widest rounded-full gap-2 shrink-0"><UserPlus className="w-3.5 h-3.5" /> Staff</TabsTrigger>}
              {availableTabs.includes('settings') && <TabsTrigger value="settings" className="px-6 py-2.5 font-black uppercase text-[9px] tracking-widest rounded-full gap-2 shrink-0"><Settings2 className="w-3.5 h-3.5" /> Global</TabsTrigger>}
            </TabsList>
            <Button variant="outline" size="sm" className={cn("rounded-xl h-10 gap-2 font-black uppercase text-[10px] tracking-widest", !isAdminMuted ? "bg-primary text-white border-none" : "bg-white dark:bg-zinc-800")} onClick={toggleAdminMute}>{isAdminMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />} {isAdminMuted ? "Muted" : "Alerts On"}</Button>
          </div>

          <TabsContent value="overview" className="mt-0"><DashboardAnalysis orders={realOrders || []} products={dbMenu || []} /></TabsContent>
          <TabsContent value="users" className="mt-0"><UserManagement /></TabsContent>
          <TabsContent value="billing" className="mt-0"><BillingSystem products={dbMenu || []} orders={realOrders || []} /></TabsContent>
          <TabsContent value="kitchen" className="mt-0"><KitchenSystem orders={realOrders || []} onUpdateStatus={handleUpdateStatus} /></TabsContent>
          <TabsContent value="products" className="mt-0"><ProductManagement /></TabsContent>
          <TabsContent value="coupons" className="mt-0"><CouponManager /></TabsContent>
          <TabsContent value="staff" className="mt-0"><StaffManagement /></TabsContent>
          <TabsContent value="settings" className="mt-0"><StoreSettings /></TabsContent>

          <TabsContent value="orders" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[
                { id: 'pending', label: 'Incoming', icon: BellRing, color: 'text-primary' },
                { id: 'preparing', label: 'In Progress', icon: ChefHat, color: 'text-orange-500' },
                { id: 'completed', label: 'Resolved', icon: Package, color: 'text-muted-foreground' }
              ].map((group) => (
                <div key={group.id} className="space-y-4">
                  <div className="flex items-center justify-between px-3">
                    <div className="flex items-center gap-2">
                      <group.icon className={cn("w-4 h-4", group.color)} />
                      <h3 className="font-black uppercase tracking-[0.2em] text-[10px] opacity-60">{group.label}</h3>
                    </div>
                    <Badge variant="secondary" className="rounded-full px-2 font-black text-[9px]">{orderGroups[group.id as keyof typeof orderGroups].length}</Badge>
                  </div>
                  <div className="space-y-4">
                    {orderGroups[group.id as keyof typeof orderGroups].map((order) => (
                      <Card key={order.id} className="rounded-[1.5rem] border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden group hover:shadow-xl transition-all cursor-pointer border-l-4 border-l-transparent" onClick={() => setSelectedOrderForView(order)} style={{ borderLeftColor: order.status === 'Pending' ? '#ef4444' : order.status === 'Preparing' ? '#f97316' : '#22c55e' }}>
                        <div className="p-5 space-y-4">
                          <div className="flex justify-between items-start">
                            <div><p className="text-[9px] font-black uppercase text-primary">#{order.orderId}</p><h4 className="text-sm font-black uppercase tracking-tight truncate">{order.customerName}</h4></div>
                            <p className="text-base font-black text-primary italic">₹{order.total}</p>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t border-dashed">
                            {getStatusBadge(order)}
                            <span className="text-[8px] font-bold text-muted-foreground opacity-50 flex items-center gap-1 uppercase"><Clock className="w-3.5 h-3.5" />{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedOrderForView} onOpenChange={(open) => !open && setSelectedOrderForView(null)}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-3xl bg-white dark:bg-zinc-900">
          {selectedOrderForView && (
            <>
              <div className={cn("p-10 text-white relative overflow-hidden", selectedOrderForView.status === 'Cancelled' ? "bg-red-600" : "bg-primary")}>
                <div className="relative z-10 flex justify-between items-center">
                  <div><p className="text-[10px] font-black uppercase opacity-70 tracking-widest">Order Manifest</p><h2 className="text-4xl font-black font-headline uppercase tracking-tighter">#{selectedOrderForView.orderId}</h2></div>
                  <div className="text-right"><p className="text-[10px] font-black uppercase opacity-70 tracking-widest">Settlement</p><p className="text-4xl font-black font-headline italic">₹{selectedOrderForView.total}</p></div>
                </div>
              </div>
              <div className="p-10 space-y-8 max-h-[50vh] overflow-y-auto scrollbar-hide">
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] border-b pb-2">Line Items</h5>
                    <div className="space-y-3">
                      {selectedOrderForView.items?.map((item: any, i: number) => (
                        <div key={i} className="bg-secondary/30 dark:bg-zinc-800 p-4 rounded-2xl space-y-2">
                          <div className="flex justify-between items-center text-xs font-black uppercase"><span>{item.name} <span className="text-primary ml-1">x{item.quantity}</span></span><span className="italic">₹{item.price * item.quantity}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] border-b pb-2">Logistics</h5>
                    <div className="space-y-3">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary"><User className="w-5 h-5" /></div>
                        <div><p className="text-[9px] font-black uppercase opacity-40">Recipient</p><p className="text-sm font-black uppercase">{selectedOrderForView.customerName}</p><p className="text-[10px] font-medium opacity-60">{selectedOrderForView.customerPhone}</p></div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary"><MapPin className="w-5 h-5" /></div>
                        <div><p className="text-[9px] font-black uppercase opacity-40">Destination</p><p className="text-[11px] font-medium leading-relaxed italic">"{selectedOrderForView.address || 'In-Store Pickup'}"</p></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="p-8 bg-secondary/30 dark:bg-zinc-800 flex gap-4">
                {selectedOrderForView.status === 'Pending' && <Button className="flex-1 rounded-2xl h-16 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20" onClick={() => handleUpdateStatus(selectedOrderForView.id, 'Confirmed')}>Accept Order</Button>}
                <Button variant="ghost" className="rounded-2xl h-16 font-black uppercase text-[10px] tracking-widest px-8" onClick={() => setSelectedOrderForView(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
