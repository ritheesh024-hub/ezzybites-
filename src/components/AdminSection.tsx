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
  Megaphone,
  MessageSquare,
  TrendingUp,
  Gift,
  History,
  LayoutDashboard
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, limit, doc, updateDoc, orderBy, increment, serverTimestamp, addDoc, getDocs, where } from 'firebase/firestore';
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
import { ReviewManager } from './ReviewManager';
import { ArchiveSystem } from './ArchiveSystem';
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
  
  const ordersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(1000));
  }, [db]);
  const { data: realOrders } = useCollection<any>(ordersQuery);

  const menuQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'products'));
  }, [db]);
  const { data: dbMenu } = useCollection<any>(menuQuery);

  const [selectedOrderForView, setSelectedOrderForView] = useState<any>(null);

  const orderGroups = useMemo(() => {
    const groups = { pending: [] as any[], processing: [] as any[] };
    if (!realOrders) return groups;
    realOrders.forEach(o => {
      if (o.status === 'orderPlaced') groups.pending.push(o);
      else if (['confirmed', 'preparing', 'outForDelivery'].includes(o.status)) groups.processing.push(o);
    });
    return groups;
  }, [realOrders]);

  const handleUpdateStatus = (id: string, newStatus: string) => {
    if (!db || !user) return;
    const orderRef = doc(db, 'orders', id);
    const updateData: any = { status: newStatus };
    if (newStatus === 'confirmed') updateData.acceptedAt = serverTimestamp();

    updateDoc(orderRef, updateData)
      .then(async () => {
        const staffRef = doc(db, 'admins', user.uid);
        updateDoc(staffRef, { 
          'stats.kitchenUpdates': increment(1), 
          'stats.ordersHandled': increment(1) 
        }).catch(() => {});

        logStaffAction(user.uid, user.displayName || 'Staff', 'ORDER_STATUS_CHANGE', `Order #${id} changed to ${newStatus}`);

        const orderSnap = realOrders.find(o => o.orderId === id);
        if (orderSnap?.userId) {
          const notifRef = collection(db, 'user_notifications', orderSnap.userId, 'messages');
          const titles: Record<string, string> = {
            'confirmed': 'Order Confirmed! ✅',
            'preparing': 'Chef is on it! 👨‍🍳',
            'outForDelivery': 'Rider is Dispatched 🛵',
            'delivered': 'Enjoy your Bites! 🍱',
            'Cancelled': 'Order Cancelled ❌'
          };
          const messages: Record<string, string> = {
            'confirmed': 'Your order has been accepted by the station.',
            'preparing': 'Your premium bites are being handcrafted now.',
            'outForDelivery': 'Your premium bites are on the way to your sanctuary.',
            'delivered': 'Your order was successfully handed over. Thank you!',
            'Cancelled': 'We regret that your order was revoked. Contact support if needed.'
          };

          await addDoc(notifRef, {
            title: titles[newStatus] || `Update: ${newStatus}`,
            message: messages[newStatus] || `Your order status changed to ${newStatus}.`,
            type: 'order',
            orderId: id,
            link: `/orders/${id}`,
            read: false,
            createdAt: serverTimestamp()
          });
        }

        playSound('success');
        toast({ title: `Order Updated` });
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
    if (activeView === 'cashier') return ['overview', 'billing', 'orders', 'archive'];
    return ['overview', 'users', 'billing', 'orders', 'products', 'staff', 'reviews', 'coupons', 'notifications', 'archive', 'settings'];
  }, [activeView]);

  const getTabLabel = (tab: string) => {
    switch(tab) {
      case 'overview': return 'Analytics';
      case 'billing': return 'Counter';
      case 'orders': return 'Live Orders';
      case 'products': return 'Inventory';
      case 'notifications': return 'Broadcast';
      case 'coupons': return 'Coupons';
      default: return tab.charAt(0).toUpperCase() + tab.slice(1);
    }
  };

  const getTabIcon = (tab: string, className?: string) => {
    const iconClass = cn("w-4.5 h-4.5", className);
    switch(tab) {
      case 'overview': return <BarChart3 className={iconClass} />;
      case 'users': return <Users className={iconClass} />;
      case 'billing': return <Receipt className={iconClass} />;
      case 'kitchen': return <ChefHat className={iconClass} />;
      case 'orders': return <ShoppingBag className={iconClass} />;
      case 'archive': return <History className={iconClass} />;
      case 'products': return <Layers className={iconClass} />;
      case 'reviews': return <MessageSquare className={iconClass} />;
      case 'coupons': return <TicketPercent className={iconClass} />;
      case 'notifications': return <Megaphone className={iconClass} />;
      case 'staff': return <Fingerprint className={iconClass} />;
      case 'settings': return <Settings2 className={iconClass} />;
      default: return <BoxSelect className={iconClass} />;
    }
  };

  return (
    <div className="flex-1 flex-col lg:flex-row min-h-0 overflow-hidden flex">
      <NewOrderPopups pendingOrders={orderGroups.pending} onViewDetails={(order) => setSelectedOrderForView(order)} onUpdateStatus={handleUpdateStatus} />
      
      <Tabs defaultValue={availableTabs[0]} className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* MOBILE NAVIGATION: HORIZONTAL SCROLL OPTIMIZED */}
        <div className="lg:hidden sticky top-[70px] z-50 bg-white/95 dark:bg-black/95 backdrop-blur-3xl border-b py-3 px-4 w-full overflow-hidden">
           <TabsList className="bg-transparent h-auto flex flex-row flex-nowrap justify-start p-0 space-x-2 overflow-x-auto scrollbar-hide snap-x snap-proximity w-full border-none shadow-none">
              {availableTabs.map((tab) => (
                <TabsTrigger 
                  key={tab}
                  value={tab} 
                  className={cn(
                    "h-10 px-5 rounded-full font-black uppercase text-[9px] tracking-widest gap-2 transition-all flex-shrink-0 snap-start bg-zinc-100 dark:bg-zinc-800 whitespace-nowrap border-none",
                    "data-[state=active]:bg-primary data-[state=active]:text-white shadow-none"
                  )}
                >
                  {getTabIcon(tab, "w-3.5 h-3.5")}
                  {getTabLabel(tab)}
                  {tab === 'orders' && orderGroups.pending.length > 0 && (
                    <div className="w-1 h-1 rounded-full bg-white animate-ping" />
                  )}
                </TabsTrigger>
              ))}
           </TabsList>
        </div>

        {/* DESKTOP SIDEBAR - 220px */}
        <aside className="hidden lg:flex flex-col w-[220px] lg:w-[220px] md:w-[80px] bg-zinc-900/95 dark:bg-zinc-950/80 backdrop-blur-2xl border-r border-white/5 sticky top-[70px] h-[calc(100vh-70px)] shrink-0 transition-all duration-500 overflow-y-auto scrollbar-hide">
          <div className="p-4 space-y-8 flex-1">
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 px-4 mb-4 lg:block hidden">Operations</p>
              <TabsList className="bg-transparent flex flex-col h-auto w-full p-0 space-y-1.5 border-none shadow-none">
                {availableTabs.map((tab) => (
                  <TabsTrigger 
                    key={tab}
                    value={tab} 
                    className={cn(
                      "w-full justify-start px-4 lg:px-5 py-3.5 rounded-[1.2rem] font-bold uppercase text-[10px] tracking-widest gap-4 transition-all group outline-none",
                      "text-white/60 hover:text-white hover:bg-white/5",
                      "data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:shadow-primary/30 border-none"
                    )}
                  >
                    <div className="shrink-0 flex items-center justify-center w-5 h-5">
                      {getTabIcon(tab, "w-4.5 h-4.5 transition-transform group-hover:scale-110")}
                    </div>
                    <span className="lg:block hidden truncate flex-1 text-left">{getTabLabel(tab)}</span>
                    {tab === 'orders' && orderGroups.pending.length > 0 && (
                      <Badge className="ml-auto bg-white text-primary border-none text-[8px] h-4 w-4 p-0 flex items-center justify-center rounded-full animate-pulse lg:flex hidden">
                        {orderGroups.pending.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="lg:block hidden pt-4 border-t border-white/5">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 px-4 mb-4">Diagnostics</p>
              <div className="px-2">
                <Card className="rounded-[1.5rem] border-none bg-white/5 p-4 relative overflow-hidden group">
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/40">Audio Link</p>
                        <p className="text-[10px] font-black text-white/80 uppercase">{isAdminMuted ? 'Muted' : 'Live'}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-9 w-9 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all" onClick={toggleAdminMute}>
                        {isAdminMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          <div className="p-4 lg:block hidden">
             <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
                <div className="flex items-center gap-3 text-primary mb-1">
                  <Fingerprint className="w-4 h-4" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Node Verified</span>
                </div>
                <p className="text-[8px] font-medium text-white/40 leading-relaxed uppercase">Operational environment strictly isolated and encrypted.</p>
             </div>
          </div>
        </aside>

        {/* MAIN WORKSPACE */}
        <main className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-950/50 overflow-y-auto scrollbar-hide relative">
          <AnimatePresence mode="wait">
            {availableTabs.map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-0 outline-none p-6 md:p-8 lg:p-10">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  {tab === 'overview' && <DashboardAnalysis orders={realOrders || []} products={dbMenu || []} />}
                  {tab === 'users' && <UserManagement />}
                  {tab === 'billing' && <BillingSystem products={dbMenu || []} orders={realOrders || []} />}
                  {tab === 'kitchen' && <KitchenSystem orders={realOrders || []} onUpdateStatus={handleUpdateStatus} />}
                  {tab === 'products' && <ProductManagement />}
                  {tab === 'reviews' && <ReviewManager />}
                  {tab === 'coupons' && <CouponManager />}
                  {tab === 'notifications' && <AdminNotificationManager />}
                  {tab === 'staff' && <StaffManagement />}
                  {tab === 'settings' && <StoreSettings />}
                  {tab === 'archive' && <ArchiveSystem orders={realOrders || []} onViewDetails={(o) => setSelectedOrderForView(o)} />}
                  {tab === 'orders' && <OrderGrid orderGroups={orderGroups} onOrderClick={setSelectedOrderForView} />}
                </motion.div>
              </TabsContent>
            ))}
          </AnimatePresence>
        </main>
      </Tabs>

      {/* GLOBAL ORDER DIALOG */}
      <Dialog open={!!selectedOrderForView} onOpenChange={(open) => !open && setSelectedOrderForView(null)}>
        <DialogContent className="max-w-3xl rounded-[3rem] p-0 overflow-hidden border-none shadow-3xl bg-white dark:bg-zinc-950">
          <DialogHeader className="sr-only">
             <DialogTitle>Order Manifest: #{selectedOrderForView?.orderId}</DialogTitle>
          </DialogHeader>
          
          {selectedOrderForView && (
            <div className="flex flex-col">
              <div className={cn("p-10 text-white relative overflow-hidden", selectedOrderForView.status === 'Cancelled' ? "bg-rose-600" : "bg-primary")}>
                <div className="absolute inset-0 bg-black/5" />
                <div className="relative z-10 space-y-2">
                   <Badge className="bg-white/20 border-none font-black text-[9px] uppercase px-3 py-1 rounded-full">{selectedOrderForView.orderType || 'Online'}</Badge>
                   <h2 className="text-4xl font-black font-headline uppercase tracking-tighter italic leading-none">#{selectedOrderForView.orderId}</h2>
                </div>
                <div className="absolute bottom-10 right-10 text-right">
                  <p className="text-[9px] font-black uppercase opacity-70 tracking-[0.2em] mb-1">Settlement</p>
                  <p className="text-5xl font-black font-headline italic leading-none">₹{selectedOrderForView.total}</p>
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
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="p-8 bg-zinc-50 dark:bg-zinc-900 border-t flex gap-3">
                {selectedOrderForView.status === 'orderPlaced' && (
                  <Button 
                    className="flex-1 rounded-[1.5rem] h-16 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/20" 
                    onClick={() => handleUpdateStatus(selectedOrderForView.id, 'confirmed')}
                  >
                    Confirm Order
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="rounded-[1.5rem] h-16 font-black uppercase text-[10px] tracking-widest px-10 border-2" 
                  onClick={() => setSelectedOrderForView(null)}
                >
                  Dismiss
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
    { id: 'pending', label: 'Placed', icon: BellRing, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/20' },
    { id: 'processing', label: 'Processing', icon: ChefHat, color: 'text-orange-500', bg: 'bg-orange-500/5', border: 'border-orange-500/20' }
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start max-w-7xl">
      {categories.map((cat) => (
        <div key={cat.id} className="space-y-6">
          <div className={cn("flex items-center justify-between px-8 py-5 rounded-[2rem] border bg-white dark:bg-zinc-900 shadow-sm transition-all", cat.border)}>
            <div className="flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner", cat.bg, cat.color)}>
                <cat.icon className="w-6 h-6" />
              </div>
              <h3 className="font-black uppercase tracking-tight text-sm italic">{cat.label} Board</h3>
            </div>
            <Badge variant="secondary" className="rounded-full h-8 min-w-[32px] px-3 flex items-center justify-center font-black text-[11px] bg-zinc-100 dark:bg-zinc-800">{orderGroups[cat.id].length}</Badge>
          </div>
          
          <div className="space-y-4">
            {orderGroups[cat.id].length === 0 ? (
              <div className="py-20 text-center opacity-20 bg-secondary/10 rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center gap-4">
                <cat.icon className="w-10 h-10 opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] italic">Station Idle</p>
              </div>
            ) : (
              orderGroups[cat.id].map((order: any) => (
                <motion.div key={order.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Card 
                    className="rounded-[2.5rem] border-none shadow-sm hover:shadow-2xl transition-all cursor-pointer bg-white dark:bg-zinc-900 overflow-hidden group active:scale-[0.98] border-l-[6px] border-l-transparent" 
                    onClick={() => onOrderClick(order)} 
                    style={{ borderLeftColor: order.status === 'orderPlaced' ? '#ef4444' : (order.status === 'confirmed' || order.status === 'preparing' || order.status === 'outForDelivery') ? '#f97316' : '#10b981' }}
                  >
                    <div className="p-8 space-y-5">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase text-primary italic tracking-tight">Ticket #{order.orderId}</p>
                          <h4 className="text-xl font-black uppercase tracking-tighter truncate max-w-[180px] leading-none group-hover:text-primary transition-colors">{order.customerName}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black uppercase opacity-30 mb-0.5 tracking-widest">Settlement</p>
                          <p className="text-2xl font-black text-primary italic leading-none">₹{order.total}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-5 border-t border-dashed opacity-60">
                        <Badge className={cn(
                          "px-3 py-1 text-[8px] uppercase font-black border-none rounded-md shadow-sm",
                          order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 
                          order.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'
                        )}>{order.status}</Badge>
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
                          <Clock className="w-3.5 h-3.5 text-primary opacity-40" />
                          {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Live Now'}
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
