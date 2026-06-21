
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

  if (ordersError) {
    const isPermissionError = (ordersError as any).code === 'permission-denied';
    return (
      <div className="p-20 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600">
           {isPermissionError ? <Fingerprint className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
        </div>
        <h3 className="text-xl font-black uppercase tracking-tighter">
          {isPermissionError ? 'Permission Denied' : 'Data Sync Issue'}
        </h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          {isPermissionError 
            ? "Your identity node has not been fully verified for order access. Please contact the fleet commander."
            : "An unexpected error occurred while syncing with the cloud ledger. Please check your connection or console for index requirements."}
        </p>
        <Button variant="outline" onClick={() => window.location.reload()} className="rounded-xl px-8 font-black uppercase text-[10px]">
          Retry Node Sync
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-visible">
      <NewOrderPopups pendingOrders={orderGroups.pending} onViewDetails={(order) => setSelectedOrderForView(order)} onUpdateStatus={handleUpdateStatus} />
      
      <Tabs defaultValue={availableTabs[0]} className="flex-1 flex flex-col lg:flex-row min-h-0">
        <div className="lg:hidden sticky top-[70px] z-[90] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b shadow-sm w-full overflow-hidden shrink-0">
           <TabsList className="bg-transparent h-auto flex flex-row flex-nowrap justify-start p-3 space-x-2 overflow-x-auto scrollbar-hide snap-x w-full border-none">
              {availableTabs.map((tab) => (
                <TabsTrigger 
                  key={tab}
                  value={tab} 
                  className={cn(
                    "h-10 px-5 rounded-full font-black uppercase text-[9px] tracking-widest gap-2 transition-all shrink-0 snap-start bg-secondary/50 border-none whitespace-nowrap",
                    "data-[state=active]:bg-primary data-[state=active]:text-white shadow-lg shadow-primary/20"
                  )}
                >
                  {getTabIcon(tab, "w-3.5 h-3.5")}
                  {getTabLabel(tab)}
                  {tab === 'orders' && orderGroups.pending.length > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </TabsTrigger>
              ))}
           </TabsList>
        </div>

        <aside className="hidden lg:flex flex-col w-[220px] bg-zinc-900/95 dark:bg-zinc-950/80 backdrop-blur-2xl border-r border-white/5 sticky top-[70px] h-[calc(100vh-70px)] shrink-0 z-40 overflow-y-auto scrollbar-hide">
          <div className="p-4 space-y-8 flex-1">
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 px-4 mb-4">Operations</p>
              <TabsList className="bg-transparent flex flex-col h-auto w-full p-0 space-y-1.5 border-none">
                {availableTabs.map((tab) => (
                  <TabsTrigger 
                    key={tab}
                    value={tab} 
                    className={cn(
                      "w-full justify-start px-5 py-3.5 rounded-[1.2rem] font-bold uppercase text-[10px] tracking-widest gap-4 transition-all group outline-none",
                      "text-white/60 hover:text-white hover:bg-white/5",
                      "data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:shadow-primary/30 border-none"
                    )}
                  >
                    <div className="shrink-0 flex items-center justify-center w-5 h-5">
                      {getTabIcon(tab, "w-4.5 h-4.5 transition-transform group-hover:scale-110")}
                    </div>
                    <span className="truncate flex-1 text-left">{getTabLabel(tab)}</span>
                    {tab === 'orders' && orderGroups.pending.length > 0 && (
                      <Badge className="ml-auto bg-white text-primary border-none text-[8px] h-4 w-4 p-0 flex items-center justify-center rounded-full animate-pulse">
                        {orderGroups.pending.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="pt-4 border-t border-white/5">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 px-4 mb-4">Diagnostics</p>
              <div className="px-2">
                <Card className="rounded-[1.5rem] border-none bg-white/5 p-4 relative overflow-hidden group">
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/40">Audio Link</p>
                        <p className="text-[10px] font-black text-white/80 uppercase">{isAdminMuted ? 'Muted' : 'Live'}</p>
                      </div>
                      <button onClick={toggleAdminMute} className="h-9 w-9 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all flex items-center justify-center">
                        {isAdminMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-950/50 overflow-visible relative z-0">
          <AnimatePresence mode="wait">
            {availableTabs.map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-0 outline-none p-4 md:p-8 lg:p-10">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
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
                  {tab === 'orders' && <OrderGrid orderGroups={orderGroups} onOrderClick={setSelectedOrderForView} activeView={activeView} handleUpdateStatus={handleUpdateStatus} />}
                </motion.div>
              </TabsContent>
            ))}
          </AnimatePresence>
        </main>
      </Tabs>

      <Dialog open={!!selectedOrderForView} onOpenChange={(open) => !open && setSelectedOrderForView(null)}>
        <DialogContent className="max-w-3xl rounded-[3rem] p-0 overflow-hidden border-none shadow-3xl bg-white dark:bg-zinc-950">
          <DialogHeader className="p-8 border-b bg-muted/5">
             <DialogTitle>Order Manifest: #{selectedOrderForView?.orderId}</DialogTitle>
             <DialogDescription>Detailed itemized view and customer logistics for order #{selectedOrderForView?.orderId}</DialogDescription>
          </DialogHeader>
          
          {selectedOrderForView && (
            <div className="flex flex-col">
              <div className={cn("p-8 md:p-10 text-white relative overflow-hidden", selectedOrderForView.status === 'Cancelled' ? "bg-rose-600" : "bg-primary")}>
                <div className="absolute inset-0 bg-black/5" />
                <div className="relative z-10 space-y-2">
                   <Badge className="bg-white/20 border-none font-black text-[9px] uppercase px-3 py-1 rounded-full">{selectedOrderForView.orderType || 'Online'}</Badge>
                   <h2 className="text-2xl md:text-4xl font-black font-headline uppercase tracking-tighter italic leading-none">#{selectedOrderForView.orderId}</h2>
                </div>
                <div className="absolute bottom-8 right-8 md:bottom-10 md:right-10 text-right">
                  <p className="text-[9px] font-black uppercase opacity-70 tracking-[0.2em] mb-1">Settlement</p>
                  <p className="text-3xl md:text-5xl font-black font-headline italic leading-none">₹{selectedOrderForView.total}</p>
                </div>
              </div>

              <div className="p-8 md:p-10 space-y-10 max-h-[60vh] overflow-y-auto scrollbar-hide">
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

              <DialogFooter className="p-6 md:p-8 bg-zinc-50 dark:bg-zinc-900 border-t flex flex-col sm:flex-row gap-3">
                {selectedOrderForView.status === 'pending' && (activeView === 'admin' || activeView === 'cashier') && (
                  <Button 
                    className="flex-1 rounded-[1.5rem] h-14 md:h-16 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/20" 
                    onClick={() => handleUpdateStatus(selectedOrderForView.id, 'accepted')}
                  >
                    Accept Order
                  </Button>
                )}
                {selectedOrderForView.status === 'out_for_delivery' && (activeView === 'admin' || activeView === 'cashier') && (
                  <Button 
                    className="flex-1 rounded-[1.5rem] h-14 md:h-16 bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-emerald-600/20" 
                    onClick={() => handleUpdateStatus(selectedOrderForView.id, 'delivered')}
                  >
                    Mark Delivered
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="rounded-[1.5rem] h-14 md:h-16 font-black uppercase text-[10px] tracking-widest px-10 border-2" 
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
    { id: 'pending', label: 'New Tickets', icon: BellRing, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/20' },
    { id: 'processing', label: 'In Flow', icon: ChefHat, color: 'text-orange-500', bg: 'bg-orange-500/5', border: 'border-orange-500/20' }
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 items-start max-w-7xl">
      {categories.map((cat) => (
        <div key={cat.id} className="space-y-4 md:space-y-6">
          <div className={cn("flex items-center justify-between px-6 py-4 md:px-8 md:py-5 rounded-[1.5rem] md:rounded-[2rem] border bg-white dark:bg-zinc-900 shadow-sm transition-all", cat.border)}>
            <div className="flex items-center gap-4">
              <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-inner", cat.bg, cat.color)}>
                <cat.icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="font-black uppercase tracking-tight text-xs md:text-sm italic">{cat.label} Board</h3>
            </div>
            <Badge variant="secondary" className="rounded-full h-8 min-w-[32px] px-3 flex items-center justify-center font-black text-[11px] bg-zinc-100 dark:bg-zinc-800">{orderGroups[cat.id].length}</Badge>
          </div>
          
          <div className="space-y-4">
            {orderGroups[cat.id].length === 0 ? (
              <div className="py-16 md:py-20 text-center opacity-20 bg-secondary/10 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center gap-4">
                <cat.icon className="w-8 h-8 md:w-10 md:h-10 opacity-10" />
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] italic">Station Idle</p>
              </div>
            ) : (
              orderGroups[cat.id].map((order: any) => (
                <motion.div key={order.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Card 
                    className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-sm hover:shadow-2xl transition-all cursor-pointer bg-white dark:bg-zinc-900 overflow-hidden group border-l-[6px] border-l-transparent" 
                    onClick={() => onOrderClick(order)} 
                    style={{ borderLeftColor: order.status === 'pending' ? '#ef4444' : '#f97316' }}
                  >
                    <div className="p-6 md:p-8 space-y-4 md:space-y-5">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-[9px] md:text-[10px] font-black uppercase text-primary italic tracking-tight">Ticket #{order.orderId}</p>
                          <h4 className="text-lg md:text-xl font-black uppercase tracking-tighter truncate max-w-[150px] md:max-w-[180px] leading-none group-hover:text-primary transition-colors">{order.customerName}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] md:text-[9px] font-black uppercase opacity-30 mb-0.5 tracking-widest">Gross</p>
                          <p className="text-xl md:text-2xl font-black text-primary italic leading-none">₹{order.total}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 md:pt-5 border-t border-dashed opacity-60">
                        <div className="flex gap-2">
                           <Badge className={cn(
                             "px-2 py-0.5 md:px-3 md:py-1 text-[7px] md:text-[8px] uppercase font-black border-none rounded-md shadow-sm",
                             order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 
                             order.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'
                           )}>{order.status.replace(/_/g, ' ')}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest">
                          <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-primary opacity-40" />
                          {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Live Now'}
                        </div>
                      </div>

                      {order.status === 'pending' && (activeView === 'admin' || activeView === 'cashier') && (
                         <div className="pt-3 md:pt-4 flex gap-2">
                            <Button size="sm" className="flex-1 rounded-xl h-9 md:h-10 font-black uppercase text-[7px] md:text-[8px] bg-primary" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'accepted'); }}>
                               Accept Ticket
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 rounded-xl h-9 md:h-10 font-black uppercase text-[7px] md:text-[8px] border-2" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'Cancelled'); }}>
                               Reject
                            </Button>
                         </div>
                      )}
                      
                      {order.status === 'out_for_delivery' && (activeView === 'admin' || activeView === 'cashier') && (
                        <Button size="sm" className="w-full rounded-xl h-9 md:h-10 font-black uppercase text-[7px] md:text-[8px] bg-emerald-600" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'delivered'); }}>
                          Complete Delivery
                        </Button>
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
