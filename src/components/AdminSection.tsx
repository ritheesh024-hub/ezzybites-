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
  Star,
  Utensils,
  Home,
  X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useUser, useAuth, useFirestore, useCollection } from '@/firebase';
import { collection, query, limit, doc, updateDoc, orderBy, increment, serverTimestamp, addDoc } from 'firebase/firestore';
import { format } from 'date-fns';
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
        updateDoc(staffRef, { 'stats.ordersHandled': increment(1) }).catch(() => {});
        logStaffAction(user.uid, user.displayName || 'Staff', 'ORDER_STATUS_CHANGE', `Order #${id} changed to ${newStatus}`);
        playSound('success');
        toast({ title: `Order Updated` });
        if (selectedOrderForView?.id === id) setSelectedOrderForView(null);
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
    return (
      <div className="p-10 md:p-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h3 className="text-xl font-black uppercase tracking-tighter">Sync Error</h3>
        <Button variant="outline" onClick={() => window.location.reload()} className="rounded-xl h-10 px-8 border-2">Retry Sync</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-visible">
      <NewOrderPopups pendingOrders={orderGroups.pending} onViewDetails={(order) => setSelectedOrderForView(order)} onUpdateStatus={handleUpdateStatus} />
      
      <Tabs key={activeView} defaultValue={availableTabs[0]} className="flex-1 flex flex-col lg:flex-row min-h-0">
        <div className="lg:hidden sticky top-[70px] z-[90] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b shadow-sm w-full overflow-hidden shrink-0">
           <TabsList className="bg-transparent h-auto flex flex-row flex-nowrap justify-start p-2 space-x-1.5 overflow-x-auto scrollbar-hide snap-x w-full border-none">
              {availableTabs.map((tab) => (
                <TabsTrigger key={tab} value={tab} className="h-9 px-4 rounded-full font-black uppercase text-[8px] tracking-widest transition-all shrink-0 snap-start bg-secondary/60 data-[state=active]:bg-primary data-[state=active]:text-white shadow-md border-none whitespace-nowrap">
                  {getTabIcon(tab, "w-3 h-3 mr-1.5")} {getTabLabel(tab)}
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
                  <TabsTrigger key={tab} value={tab} className="w-full justify-start px-4 py-2.5 rounded-xl font-bold uppercase text-[9px] tracking-widest gap-3 transition-all text-white/40 hover:text-white hover:bg-white/5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl border-none">
                    <div className="shrink-0 flex items-center justify-center w-4 h-4">{getTabIcon(tab, "w-4 h-4")}</div>
                    <span className="truncate flex-1 text-left">{getTabLabel(tab)}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-950/50 overflow-visible relative z-0">
          <AnimatePresence mode="wait">
            {availableTabs.map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-0 outline-none p-3 md:p-6 lg:p-8">
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>
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
          <DialogHeader className="p-5 md:p-6 border-b bg-muted/5 flex flex-row items-center justify-between">
             <DialogTitle className="text-lg font-black uppercase tracking-tight">Manifest: #{selectedOrderForView?.orderId}</DialogTitle>
             <DialogDescription className="sr-only">Detailed view of order items and fulfillment node.</DialogDescription>
          </DialogHeader>
          {selectedOrderForView && (
            <div className="flex flex-col">
              <div className={cn("p-6 md:p-8 text-white relative bg-primary")}>
                <h2 className="text-2xl md:text-3xl font-black italic">#{selectedOrderForView.orderId}</h2>
                <div className="absolute bottom-6 right-6 text-right">
                  <p className="text-[7px] font-black uppercase opacity-60">Payable</p>
                  <p className="text-2xl md:text-4xl font-black italic">₹{selectedOrderForView.total}</p>
                </div>
              </div>
              <div className="p-6 md:p-8 space-y-8 max-h-[50vh] overflow-y-auto scrollbar-hide">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h5 className="text-[9px] font-black uppercase text-primary tracking-[0.2em] border-b pb-2">Items</h5>
                    <div className="space-y-2">
                      {selectedOrderForView.items?.map((item: any, i: number) => (
                        <div key={i} className="bg-secondary/40 p-3 rounded-xl flex justify-between items-center">
                           <span className="text-[11px] font-bold uppercase truncate pr-3">{item.name}</span>
                           <span className="w-6 h-6 rounded-lg bg-white flex items-center justify-center font-black text-[10px] text-primary shadow-sm">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h5 className="text-[9px] font-black uppercase text-primary tracking-[0.2em] border-b pb-2">Recipient</h5>
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl space-y-2">
                        <p className="text-[11px] font-black uppercase truncate">{selectedOrderForView.customerName}</p>
                        <p className="text-[9px] font-bold opacity-50">{selectedOrderForView.customerPhone}</p>
                        <p className="text-10px font-medium leading-relaxed italic opacity-80 pt-2 border-t border-dashed mt-2">{selectedOrderForView.address}</p>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="p-4 md:p-6 bg-zinc-50 dark:bg-zinc-900 border-t">
                <Button variant="outline" className="w-full h-12 rounded-xl font-black uppercase text-[9px] tracking-widest border-2" onClick={() => setSelectedOrderForView(null)}>Close</Button>
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
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shadow-inner", cat.bg, cat.color)}><cat.icon className="w-4 h-4" /></div>
              <h3 className="font-black uppercase tracking-tight text-[10px] md:text-[11px] italic">{cat.label} Board</h3>
            </div>
            <Badge variant="secondary" className="rounded-lg h-6 px-2 font-black text-[9px]">{orderGroups[cat.id].length}</Badge>
          </div>
          <div className="grid gap-3">
            {orderGroups[cat.id].map((order: any) => (
              <Card key={order.id} className="rounded-2xl border-none shadow-sm hover:shadow-lg transition-all cursor-pointer bg-white dark:bg-zinc-900 p-4" onClick={() => onOrderClick(order)}>
                <div className="flex justify-between items-start mb-3">
                   <div><p className="text-[8px] font-black uppercase text-primary">#{order.orderId}</p><h4 className="text-sm font-black uppercase truncate max-w-[120px]">{order.customerName}</h4></div>
                   <p className="text-[10px] font-black text-primary">₹{order.total}</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-dashed opacity-60">
                   <Badge className="px-1.5 py-0.5 text-[6px] font-black uppercase rounded-md bg-secondary/50">{order.status.replace(/_/g, ' ')}</Badge>
                   <span className="text-[8px] font-black uppercase opacity-40">{order.createdAt?.toDate ? format(order.createdAt.toDate(), 'hh:mm a') : 'Live'}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
