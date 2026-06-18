"use client"
import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Package, Clock, ChefHat, 
  Receipt, ShoppingBag, 
  Volume2, VolumeX, BellRing,
  MapPin, User,
  Users, TicketPercent, BarChart3, Fingerprint,
  Settings2,
  Zap,
  BoxSelect,
  Layers,
  Ban,
  Bell,
  Megaphone
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, limit, doc, updateDoc, orderBy, increment, serverTimestamp, addDoc } from 'firebase/firestore';
import { DashboardAnalysis } from './DashboardAnalysis';
import { BillingSystem } from './BillingSystem';
import { StoreSettings } from './StoreSettings';
import { NewOrderPopups } from './NewOrderPopups';
import { KitchenSystem } from './KitchenSystem';
import { StaffManagement } from './StaffManagement';
import { CouponManager } from './CouponManager';
import { UserManagement } from './UserManagement';
import { ProductManagement } from './ProductManagement';
import { AdminNotificationManager } from './AdminNotificationManager';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/use-sound';
import { StaffRole } from '@/app/admin/dashboard/page';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalytics } from '@/hooks/use-analytics';

interface AdminSectionProps {
  assignedRole: StaffRole;
  activeView: StaffRole;
}

export const AdminSection = ({ assignedRole, activeView }: AdminSectionProps) => {
  const db = useFirestore();
  const { user } = useUser();
  const { playSound, isAdminMuted, toggleAdminMute } = useSound();
  const { logStaffAction } = useAnalytics();
  
  // Real-time Data Listeners
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
    if (!db || !user) return;
    const orderRef = doc(db, 'orders', id);
    const updateData: any = { status: newStatus };
    if (newStatus === 'Confirmed') updateData.acceptedAt = serverTimestamp();

    updateDoc(orderRef, updateData)
      .then(async () => {
        // 1. Log staff action
        const staffRef = doc(db, 'admins', user.uid);
        updateDoc(staffRef, { 
          'stats.kitchenUpdates': increment(1), 
          'stats.ordersHandled': increment(1) 
        }).catch(() => {});

        logStaffAction(user.uid, user.displayName || 'Staff', 'ORDER_STATUS_CHANGE', `Order #${id} changed to ${newStatus}`);

        // 2. Trigger push notification for customer
        const orderSnap = realOrders.find(o => o.orderId === id);
        if (orderSnap?.userId) {
          const notifRef = collection(db, 'users', orderSnap.userId, 'notifications');
          const titles: Record<string, string> = {
            'Confirmed': 'Order Confirmed! ✅',
            'Preparing': 'Chef is Cooking 🍳',
            'Out for Delivery': 'Rider is Dispatched 🛵',
            'Delivered': 'Enjoy your Bites! 🍱',
            'Cancelled': 'Order Cancelled ❌'
          };
          const bodies: Record<string, string> = {
            'Confirmed': 'Your order has been accepted by the station.',
            'Preparing': 'Fresh ingredients are being prepared for your meal.',
            'Out for Delivery': 'Your premium bites are on the way to your sanctuary.',
            'Delivered': 'Your order was successfully handed over. Thank you!',
            'Cancelled': 'We regret that your order was revoked. Contact support if needed.'
          };

          await addDoc(notifRef, {
            title: titles[newStatus] || `Update: ${newStatus}`,
            body: bodies[newStatus] || `Your order status changed to ${newStatus}.`,
            type: 'order',
            orderId: id,
            link: `/orders/${id}`,
            read: false,
            createdAt: serverTimestamp()
          });
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

  const availableTabs = useMemo(() => {
    if (activeView === 'kitchen') return ['kitchen'];
    if (activeView === 'cashier') return ['overview', 'billing', 'orders'];
    return ['overview', 'users', 'billing', 'orders', 'products', 'coupons', 'notifications', 'staff', 'settings'];
  }, [activeView]);

  return (
    <div className="w-full">
      <NewOrderPopups pendingOrders={orderGroups.pending} onViewDetails={(order) => setSelectedOrderForView(order)} onUpdateStatus={handleUpdateStatus} />
      
      <Tabs defaultValue={availableTabs[0]} className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* NAVIGATION SIDEBAR */}
        <aside className="lg:w-72 shrink-0">
          <div className="sticky top-28 space-y-6">
            <div className="space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground px-4 opacity-50">Operational Hub</h2>
              <TabsList className="bg-white dark:bg-zinc-900 flex flex-col h-auto w-full p-2 rounded-[2.5rem] border shadow-sm space-y-1">
                {availableTabs.map((tab) => (
                  <TabsTrigger 
                    key={tab}
                    value={tab} 
                    className="w-full justify-start px-6 py-4 rounded-[1.5rem] font-bold uppercase text-[10px] tracking-widest gap-4 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all group outline-none"
                  >
                    {tab === 'overview' && <BarChart3 className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                    {tab === 'users' && <Users className="w-4 h-4" />}
                    {tab === 'billing' && <Receipt className="w-4 h-4" />}
                    {tab === 'kitchen' && <ChefHat className="w-4 h-4" />}
                    {tab === 'orders' && (
                      <div className="flex items-center gap-4 flex-1">
                        <ShoppingBag className="w-4 h-4" />
                        <span>Live Feed</span>
                        {orderGroups.pending.length > 0 && (
                          <Badge className="ml-auto bg-white text-primary border-none text-[8px] h-5 w-5 p-0 flex items-center justify-center rounded-full animate-pulse shadow-sm">
                            {orderGroups.pending.length}
                          </Badge>
                        )}
                      </div>
                    )}
                    {tab === 'products' && <Layers className="w-4 h-4" />}
                    {tab === 'coupons' && <TicketPercent className="w-4 h-4" />}
                    {tab === 'notifications' && <Megaphone className="w-4 h-4" />}
                    {tab === 'staff' && <Fingerprint className="w-4 h-4" />}
                    {tab === 'settings' && <Settings2 className="w-4 h-4" />}
                    <span className="capitalize">{tab === 'overview' ? 'Analytics' : tab === 'billing' ? 'Counter' : tab === 'products' ? 'Inventory' : tab === 'notifications' ? 'Broadcast' : tab}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <Card className="rounded-[2rem] border-none shadow-xl bg-orange-gradient text-white p-6 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-10 transform group-hover:rotate-12 transition-transform duration-1000"><Zap className="w-24 h-24" /></div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Audio Alerts</p>
                    <p className="text-[11px] font-bold">{isAdminMuted ? 'Muted' : 'Operational'}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-10 w-10 bg-white/20 hover:bg-white/30 rounded-xl transition-all" onClick={toggleAdminMute}>
                    {isAdminMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <section className="flex-1 min-w-0 min-h-[80vh]">
          <AnimatePresence mode="wait">
            {availableTabs.map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-0 outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {tab === 'overview' && <DashboardAnalysis orders={realOrders || []} products={dbMenu || []} />}
                  {tab === 'users' && <UserManagement />}
                  {tab === 'billing' && <BillingSystem products={dbMenu || []} orders={realOrders || []} />}
                  {tab === 'kitchen' && <KitchenSystem orders={realOrders || []} onUpdateStatus={handleUpdateStatus} />}
                  {tab === 'products' && <ProductManagement />}
                  {tab === 'coupons' && <CouponManager />}
                  {tab === 'notifications' && <AdminNotificationManager />}
                  {tab === 'staff' && <StaffManagement />}
                  {tab === 'settings' && <StoreSettings />}
                  {tab === 'orders' && <OrderGrid orderGroups={orderGroups} onOrderClick={setSelectedOrderForView} />}
                </motion.div>
              </TabsContent>
            ))}
          </AnimatePresence>
        </section>
      </Tabs>

      {/* GLOBAL ORDER PREVIEW DIALOG */}
      <Dialog open={!!selectedOrderForView} onOpenChange={(open) => !open && setSelectedOrderForView(null)}>
        <DialogContent className="max-w-3xl rounded-[3rem] p-0 overflow-hidden border-none shadow-3xl bg-white dark:bg-zinc-950">
          {selectedOrderForView && (
            <div className="flex flex-col">
              <div className={cn("p-10 text-white relative overflow-hidden", selectedOrderForView.status === 'Cancelled' ? "bg-rose-600" : "bg-primary")}>
                <div className="absolute inset-0 bg-black/5" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <div className="flex items-center gap-3 bg-white/20 w-fit px-3 py-1 rounded-full mb-3 backdrop-blur-md border border-white/10">
                      <span className="text-[10px] font-black uppercase tracking-widest">{selectedOrderForView.orderType || 'Order'}</span>
                    </div>
                    <h2 className="text-4xl font-black font-headline uppercase tracking-tighter italic leading-none">#{selectedOrderForView.orderId}</h2>
                  </div>
                  <div className="md:text-right">
                    <p className="text-[9px] font-black uppercase opacity-70 tracking-[0.2em] mb-1">Settlement</p>
                    <p className="text-4xl font-black font-headline italic leading-none">₹{selectedOrderForView.total}</p>
                  </div>
                </div>
              </div>

              <div className="p-10 space-y-10 max-h-[60vh] overflow-y-auto scrollbar-hide">
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h5 className="text-[10px] font-black uppercase text-primary tracking-[0.4em] flex items-center gap-2 border-b pb-2">
                      <Layers className="w-4 h-4" /> Manifest Identity
                    </h5>
                    <div className="space-y-3">
                      {selectedOrderForView.items?.map((item: any, i: number) => (
                        <div key={i} className="bg-secondary/30 dark:bg-zinc-800/50 p-4 rounded-[1.2rem] border border-transparent hover:border-primary/10 transition-all">
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-sm font-black uppercase tracking-tight truncate flex-1 pr-4">{item.name}</span>
                             <span className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-700 flex items-center justify-center font-black text-xs shadow-sm text-primary">x{item.quantity}</span>
                          </div>
                          <div className="flex justify-between items-end">
                             <div className="flex flex-wrap gap-1">
                                {item.customization && <Badge variant="outline" className="text-[7px] font-black uppercase border-none bg-white/40">{item.customization.size}</Badge>}
                             </div>
                             <span className="font-bold text-[11px] opacity-60">₹{item.price * item.quantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h5 className="text-[10px] font-black uppercase text-primary tracking-[0.4em] flex items-center gap-2 border-b pb-2">
                      <User className="w-4 h-4" /> Logistics Node
                    </h5>
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-[1.8rem] space-y-6 border">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-700 flex items-center justify-center shrink-0 shadow-sm"><User className="w-5 h-5 text-primary" /></div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase opacity-40 mb-0.5">Recipient</p>
                            <p className="text-sm font-black uppercase truncate">{selectedOrderForView.customerName}</p>
                            <p className="text-[10px] font-bold opacity-60">{selectedOrderForView.customerPhone}</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-700 flex items-center justify-center shrink-0 shadow-sm"><MapPin className="w-5 h-5 text-primary" /></div>
                          <div className="flex-1">
                            <p className="text-[10px] font-black uppercase opacity-40 mb-0.5">Drop-off</p>
                            <p className="text-[11px] font-medium leading-relaxed italic text-muted-foreground line-clamp-2">"{selectedOrderForView.address || 'Standard Pickup'}"</p>
                          </div>
                        </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="p-8 bg-zinc-50 dark:bg-zinc-900 border-t flex gap-3">
                {selectedOrderForView.status === 'Pending' && (
                  <Button 
                    className="flex-1 rounded-[1.5rem] h-16 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/20" 
                    onClick={() => handleUpdateStatus(selectedOrderForView.id, 'Confirmed')}
                  >
                    Confirm Order
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="rounded-[1.5rem] h-16 font-black uppercase text-[10px] tracking-widest px-10 border-2" 
                  onClick={() => setSelectedOrderForView(null)}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const OrderGrid = ({ orderGroups, onOrderClick }: any) => {
  const categories = [
    { id: 'pending', label: 'Queued', icon: BellRing, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/20' },
    { id: 'preparing', label: 'Processing', icon: ChefHat, color: 'text-orange-500', bg: 'bg-orange-500/5', border: 'border-orange-500/20' },
    { id: 'completed', label: 'Finalized', icon: BoxSelect, color: 'text-emerald-500', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' }
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
      {categories.map((cat) => (
        <div key={cat.id} className="space-y-6">
          <div className={cn("flex items-center justify-between px-6 py-4 rounded-[1.8rem] border bg-white dark:bg-zinc-900 shadow-sm", cat.border)}>
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", cat.bg, cat.color)}>
                <cat.icon className="w-5 h-5" />
              </div>
              <h3 className="font-black uppercase tracking-tight text-xs">{cat.label}</h3>
            </div>
            <Badge variant="secondary" className="rounded-full h-7 min-w-[28px] px-2 flex items-center justify-center font-black text-[10px]">{orderGroups[cat.id].length}</Badge>
          </div>
          
          <div className="space-y-4">
            {orderGroups[cat.id].length === 0 ? (
              <div className="py-12 text-center opacity-20 bg-secondary/10 rounded-[2.5rem] border-2 border-dashed">
                <cat.icon className="w-8 h-8 mx-auto mb-2" />
                <p className="text-[9px] font-black uppercase tracking-widest">Board Clear</p>
              </div>
            ) : (
              orderGroups[cat.id].map((order: any) => (
                <motion.div key={order.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card 
                    className="rounded-[2rem] border-none shadow-sm hover:shadow-xl transition-all cursor-pointer bg-white dark:bg-zinc-900 overflow-hidden group active:scale-[0.98] border-l-4 border-l-transparent" 
                    onClick={() => onOrderClick(order)} 
                    style={{ borderLeftColor: order.status === 'Pending' ? '#ef4444' : order.status === 'Preparing' ? '#f97316' : '#10b981' }}
                  >
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-black uppercase text-primary italic">#{order.orderId}</p>
                          <h4 className="text-base font-black uppercase tracking-tighter truncate max-w-[140px]">{order.customerName}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black uppercase opacity-30 mb-0.5">Gross</p>
                          <p className="text-lg font-black text-primary italic leading-none">₹{order.total}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-dashed opacity-60">
                        <Badge className={cn(
                          "px-2 py-0.5 text-[7px] uppercase font-black border-none",
                          order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 
                          order.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'
                        )}>{order.status}</Badge>
                        <div className="flex items-center gap-1.5 text-[8px] font-black uppercase">
                          <Clock className="w-3 h-3" />
                          {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Live'}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
