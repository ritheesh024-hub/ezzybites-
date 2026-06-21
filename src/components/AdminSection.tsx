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
  BoxSelect,
  Layers,
  Ban,
  Megaphone,
  MessageSquare,
  History,
  LayoutDashboard,
  Truck,
  CheckCircle2,
  AlertCircle,
  Star
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useUser, useAuth, useFirestore, useCollection } from '@/firebase';
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
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(500));
  }, [db]);

  const { data: realOrders, loading: ordersLoading, error: ordersError } = useCollection<any>(ordersQuery);

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
      if (o.status === 'pending') groups.pending.push(o);
      else if (['accepted', 'preparing', 'out_for_delivery'].includes(o.status)) groups.processing.push(o);
    });
    return groups;
  }, [realOrders]);

  const handleUpdateStatus = (id: string, newStatus: string) => {
    if (!db || !user) return;
    const orderRef = doc(db, 'orders', id);
    const updateData: any = { 
      status: newStatus,
      updatedAt: serverTimestamp()
    };
    
    if (newStatus === 'accepted') updateData.acceptedAt = serverTimestamp();
    if (newStatus === 'delivered') updateData.deliveredAt = serverTimestamp();

    updateDoc(orderRef, updateData)
      .then(async () => {
        const staffRef = doc(db, 'admins', user.uid);
        updateDoc(staffRef, { 
          'stats.ordersHandled': increment(1) 
        }).catch(() => {});

        logStaffAction(user.uid, user.displayName || 'Staff', 'ORDER_STATUS_CHANGE', `Order #${id} changed to ${newStatus}`);

        const orderSnap = realOrders.find(o => o.orderId === id || o.id === id);
        if (orderSnap?.userId) {
          const notifRef = collection(db, 'user_notifications', orderSnap.userId, 'items');
          const titles: Record<string, string> = {
            'accepted': 'Order Confirmed! ✅',
            'preparing': 'Chef is on it! 👨‍🍳',
            'out_for_delivery': 'Rider is Dispatched 🛵',
            'delivered': 'Enjoy your Bites! 🍱',
            'Cancelled': 'Order Cancelled ❌'
          };
          const messages: Record<string, string> = {
            'accepted': 'Your order has been accepted by the station.',
            'preparing': 'Kitchen started preparing your order.',
            'out_for_delivery': 'Your order is out for delivery.',
            'delivered': 'Your order was successfully handed over. Thank you!',
            'Cancelled': 'We regret that your order was revoked. Contact support if needed.'
          };

          await addDoc(notifRef, {
            title: titles[newStatus] || `Update: ${newStatus}`,
            message: messages[newStatus] || `Your order status changed to ${newStatus}.`,
            type: 'order',
            orderId: orderSnap.orderId || id,
            ctaLink: `/orders/${orderSnap.orderId || id}`,
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
      case 'orders': return 'Live';
      case 'products': return 'Menu';
      case 'notifications': return 'Signals';
      case 'coupons': return 'Bounty';
      case 'archive': return 'Ledger';
      default: return tab.charAt(0).toUpperCase() + tab.slice(1);
    }
  };

  const getTabIcon = (tab: string, className?: string) => {
    const iconClass = cn("w-5 h-5", className);
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

  if (ordersError) {
    const isPermissionError = (ordersError as any).code === 'permission-denied';
    return (
      <div className="p-10 md:p-20 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600">
           {isPermissionError ? <Fingerprint className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
        </div>
        <h3 className="text-xl font-black uppercase tracking-tighter">
          {isPermissionError ? 'Permission Denied' : 'Data Sync Issue'}
        </h3>
        <p className="text-muted-foreground text-[10px] md:text-sm max-w-md mx-auto uppercase font-bold tracking-tight">
          {isPermissionError 
            ? "Your identity node has not been fully verified for order access."
            : "Data sync interrupted. Check connection."}
        </p>
        <Button variant="outline" onClick={() => window.location.reload()} className="rounded-xl h-10 px-8 font-black uppercase text-[9px] border-2">
          Retry Node Sync
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-visible">
      <NewOrderPopups pendingOrders={orderGroups.pending} onViewDetails={(order) => setSelectedOrderForView(order)} onUpdateStatus={handleUpdateStatus} />
      
      {/* KEY={activeView} ensures that switching roles re-initializes the Tabs component correctly */}
      <Tabs key={activeView} defaultValue={availableTabs[0]} className="flex-1 flex flex-col lg:flex-row min-h-0">
        <div className="lg:hidden sticky top-[70px] z-[90] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b shadow-sm w-full overflow-hidden shrink-0">
           <TabsList className="bg-transparent h-auto flex flex-row flex-nowrap justify-start p-2 space-x-1.5 overflow-x-auto scrollbar-hide snap-x w-full border-none">
              {availableTabs.map((tab) => (
                <TabsTrigger 
                  key={tab}
                  value={tab} 
                  className={cn(
                    "h-9 px-4 rounded-full font-black uppercase text-[8px] tracking-widest transition-all shrink-0 snap-start bg-secondary/60 border-none whitespace-nowrap",
                    "data-[state=active]:bg-primary data-[state=active]:text-white shadow-md"
                  )}
                >
                  {getTabIcon(tab, "w-3 h-3 mr-1.5")}
                  {getTabLabel(tab)}
                  {tab === 'orders' && orderGroups.pending.length > 0 && (
                    <div className="w-1 h-1 rounded-full bg-white ml-1 animate-pulse" />
                  )}
                </TabsTrigger>
              ))}
           </TabsList>
        </div>

        <aside className="hidden lg:flex flex-col w-[200px] bg-zinc-900/95 dark:bg-zinc-950/80 backdrop-blur-2xl border-r border-white/5 sticky top-[70px] h-[calc(100vh-70px)] shrink-0 z-40 overflow-y-auto scrollbar-hide">
          <div className="p-3 space-y-6 flex-1">
            <div className="space-y-1">
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 px-3 mb-2">Operations</p>
              <TabsList className="bg-transparent flex flex-col h-auto w-full p-0 space-y-1 border-none">
                {availableTabs.map((tab) => (
                  <TabsTrigger 
                    key={tab} 
                    value={tab} 
                    className={cn(
                      "w-full justify-start px-4 py-2.5 rounded-xl font-bold uppercase text-[9px] tracking-widest gap-3 transition-all group outline-none",
                      "text-white/40 hover:text-white hover:bg-white/5",
                      "data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl border-none"
                    )}
                  >
                    <div className="shrink-0 flex items-center justify-center w-4 h-4">
                      {getTabIcon(tab, "w-4 h-4 transition-transform group-hover:scale-110")}
                    </div>
                    <span className="truncate flex-1 text-left">{getTabLabel(tab)}</span>
                    {tab === 'orders' && orderGroups.pending.length > 0 && (
                      <Badge className="ml-auto bg-white text-primary border-none text-[7px] h-3.5 w-3.5 p-0 flex items-center justify-center rounded-full animate-pulse">
                        {orderGroups.pending.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="pt-3 border-t border-white/5">
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 px-3 mb-2">System</p>
              <div className="px-1">
                <div className="rounded-xl bg-white/5 p-2 flex items-center justify-between group">
                  <div className="space-y-0.5 ml-2">
                    <p className="text-[7px] font-black uppercase tracking-widest text-white/30">Audio</p>
                    <p className="text-[8px] font-black text-white/60 uppercase">{isAdminMuted ? 'Muted' : 'Live'}</p>
                  </div>
                  <button onClick={toggleAdminMute} className="h-8 w-8 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all flex items-center justify-center">
                    {isAdminMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-950/50 overflow-visible relative z-0">
          <AnimatePresence mode="wait">
            {availableTabs.map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-0 outline-none p-3 md:p-6 lg:p-8">
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  {tab === 'overview' && <DashboardAnalysis orders={realOrders || []} products={dbMenu || []} />}
                  {tab === 'users' && <UserManagement />}
                  {tab === 'billing' && <BillingSystem products={dbMenu || []} orders={realOrders || []} />}
                  {tab === 'kitchen' && <KitchenSystem orders={realOrders || []} onUpdateStatus={handleUpdateStatus} activeView={activeView} />}
                  {tab === 'products' && <ProductManagement />}
                  {tab === 'reviews' && <ReviewManager />}
                  {tab === 'coupons' && <CouponManager />}
                  {tab === 'notifications' && <AdminNotificationManager />}
                  {tab === 'staff' && <StaffManagement />}
                  {tab === 'settings' && <StoreSettings />}
                  {tab === 'archive' && <ArchiveSystem orders={realOrders || []} onViewDetails={(o) => setSelectedOrderForView(o)} />}
                  {tab === 'orders' && <OrderGrid orderGroups={orderGroups} onOrderClick={setSelectedOrderForView} activeView={activeView} handleUpdateStatus={handleUpdateStatus} />}
                </motion.div>
              </TabsContent>
            ))}
          </AnimatePresence>
        </main>
      </Tabs>

      <Dialog open={!!selectedOrderForView} onOpenChange={(open) => !open && setSelectedOrderForView(null)}>
        <DialogContent className="max-w-2xl rounded-[2rem] p-0 overflow-hidden border-none shadow-3xl bg-white dark:bg-zinc-950">
          <DialogHeader className="p-5 md:p-6 border-b bg-muted/5">
             <DialogTitle className="text-lg font-black uppercase tracking-tight leading-none">Manifest: #{selectedOrderForView?.orderId}</DialogTitle>
             <DialogDescription className="sr-only">Detailed view of order items, customer information, and delivery destination.</DialogDescription>
          </DialogHeader>
          
          {selectedOrderForView && (
            <div className="flex flex-col">
              <div className={cn("p-6 md:p-8 text-white relative overflow-hidden", selectedOrderForView.status === 'Cancelled' ? "bg-rose-600" : "bg-primary")}>
                <div className="absolute inset-0 bg-black/5" />
                <div className="relative z-10">
                   <Badge className="bg-white/20 border-none font-black text-[7px] uppercase px-2 py-0.5 rounded-md mb-2">{selectedOrderForView.orderType || 'Online'}</Badge>
                   <h2 className="text-xl md:text-3xl font-black font-headline uppercase tracking-tighter italic leading-none">#{selectedOrderForView.orderId}</h2>
                </div>
                <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 text-right">
                  <p className="text-[7px] font-black uppercase opacity-60 tracking-widest mb-0.5">Payable</p>
                  <p className="text-2xl md:text-4xl font-black font-headline italic leading-none">₹{selectedOrderForView.total}</p>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-8 max-h-[50vh] overflow-y-auto scrollbar-hide">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h5 className="text-[9px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2 border-b pb-2">
                      <Layers className="w-3 h-3" /> Items
                    </h5>
                    <div className="space-y-2">
                      {selectedOrderForView.items?.map((item: any, i: number) => (
                        <div key={i} className="bg-secondary/40 dark:bg-zinc-800/50 p-3 rounded-xl border border-transparent flex justify-between items-center">
                           <span className="text-[11px] font-bold uppercase truncate flex-1 pr-3">{item.name}</span>
                           <span className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-700 flex items-center justify-center font-black text-[10px] text-primary shadow-sm shrink-0">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-[9px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2 border-b pb-2">
                      <User className="w-3 h-3" /> Recipient
                    </h5>
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl space-y-4 border">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-700 flex items-center justify-center shrink-0 shadow-sm"><User className="w-4 h-4 text-primary" /></div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase truncate leading-tight">{selectedOrderForView.customerName}</p>
                            <p className="text-[9px] font-bold opacity-50 tracking-tight">{selectedOrderForView.customerPhone}</p>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-dashed">
                           <p className="text-[8px] font-black uppercase opacity-30 mb-1">Destination</p>
                           <p className="text-10px font-medium leading-relaxed italic opacity-80">{selectedOrderForView.address}</p>
                        </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="p-4 md:p-6 bg-zinc-50 dark:bg-zinc-900 border-t flex flex-col sm:flex-row gap-2">
                {selectedOrderForView.status === 'pending' && (activeView === 'admin' || activeView === 'kitchen') && (
                  <Button 
                    className="flex-1 rounded-xl h-12 bg-primary text-white font-black uppercase text-[9px] tracking-widest shadow-lg shadow-primary/20" 
                    onClick={() => handleUpdateStatus(selectedOrderForView.id, 'accepted')}
                  >
                    Accept Order
                  </Button>
                )}
                {selectedOrderForView.status === 'out_for_delivery' && (activeView === 'admin' || activeView === 'cashier') && (
                  <Button 
                    className="flex-1 rounded-xl h-12 bg-emerald-600 text-white font-black uppercase text-[9px] tracking-widest shadow-lg shadow-emerald-600/20" 
                    onClick={() => handleUpdateStatus(selectedOrderForView.id, 'delivered')}
                  >
                    Mark Delivered
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="rounded-xl h-12 font-black uppercase text-[9px] tracking-widest px-8 border-2" 
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

const OrderGrid = ({ orderGroups, onOrderClick, activeView, handleUpdateStatus }: any) => {
  const categories = [
    { id: 'pending', label: 'New', icon: BellRing, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/20' },
    { id: 'processing', label: 'In Flow', icon: ChefHat, color: 'text-orange-500', bg: 'bg-orange-500/5', border: 'border-orange-500/20' }
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 items-start max-w-7xl">
      {categories.map((cat) => (
        <div key={cat.id} className="space-y-3 md:space-y-4">
          <div className={cn("flex items-center justify-between px-5 py-3 rounded-2xl border bg-white dark:bg-zinc-900 shadow-sm", cat.border)}>
            <div className="flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shadow-inner", cat.bg, cat.color)}>
                <cat.icon className="w-4 h-4" />
              </div>
              <h3 className="font-black uppercase tracking-tight text-[10px] md:text-[11px] italic">{cat.label} Board</h3>
            </div>
            <Badge variant="secondary" className="rounded-lg h-6 min-w-[24px] px-2 flex items-center justify-center font-black text-[9px] bg-zinc-100 dark:bg-zinc-800">{orderGroups[cat.id].length}</Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
            {orderGroups[cat.id].length === 0 ? (
              <div className="col-span-full py-12 text-center opacity-20 bg-secondary/10 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3">
                <cat.icon className="w-6 h-6 opacity-10" />
                <p className="text-[8px] font-black uppercase tracking-widest italic">Station Idle</p>
              </div>
            ) : (
              orderGroups[cat.id].map((order: any) => (
                <motion.div key={order.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Card 
                    className="rounded-2xl border-none shadow-sm hover:shadow-lg transition-all cursor-pointer bg-white dark:bg-zinc-900 overflow-hidden group border-l-4 border-l-transparent" 
                    onClick={() => onOrderClick(order)} 
                    style={{ borderLeftColor: order.status === 'pending' ? '#ef4444' : '#f97316' }}
                  >
                    <div className="p-4 md:p-5 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <p className="text-[8px] font-black uppercase text-primary italic tracking-tight">#{order.orderId}</p>
                          <h4 className="text-sm font-black uppercase tracking-tighter truncate max-w-[120px] leading-none group-hover:text-primary transition-colors">{order.customerName}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-primary italic leading-none">₹{order.total}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-dashed opacity-60">
                         <Badge className={cn(
                           "px-1.5 py-0.5 text-[6px] uppercase font-black border-none rounded-md",
                           order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 
                           order.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'
                         )}>{order.status.replace(/_/g, ' ')}</Badge>
                        <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest">
                          <Clock className="w-2.5 h-2.5 text-primary opacity-40" />
                          {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Live'}
                        </div>
                      </div>

                      {order.status === 'pending' && (activeView === 'admin' || activeView === 'kitchen') && (
                         <div className="pt-2 flex gap-1.5">
                            <Button size="sm" className="flex-1 rounded-lg h-8 font-black uppercase text-[7px] bg-primary" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'accepted'); }}>
                               Accept
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 rounded-lg h-8 font-black uppercase text-[7px] border-2" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'Cancelled'); }}>
                               Reject
                            </Button>
                         </div>
                      )}

                      {order.status === 'out_for_delivery' && (activeView === 'admin' || activeView === 'cashier') && (
                         <div className="pt-2 flex gap-1.5">
                            <Button size="sm" className="flex-1 rounded-lg h-8 font-black uppercase text-[7px] bg-emerald-600" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'delivered'); }}>
                               Complete Delivery
                            </Button>
                         </div>
                      )}
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
