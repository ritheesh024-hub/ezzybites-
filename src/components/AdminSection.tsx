
"use client"
import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
   indianRupee, Loader2, 
  Package, Clock, ChefHat, 
  Trash2, Database, Receipt, ShoppingBag, 
  Volume2, VolumeX, BellRing,
  MapPin, User, Settings, CheckCircle2,
  Users, UserPlus, Globe, Utensils,
  TicketPercent, BarChart3, Fingerprint,
  LayoutGrid,
  Settings2,
  Ban
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, limit, doc, updateDoc, orderBy, increment } from 'firebase/firestore';
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
import { FirestorePermissionError } from '@/firebase/errors';

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
    const groups = {
      pending: [] as any[],
      preparing: [] as any[],
      completed: [] as any[]
    };
    realOrders?.forEach(o => {
      if (o.status === 'Pending') groups.pending.push(o);
      else if (o.status === 'Preparing' || o.status === 'Out for Delivery') groups.preparing.push(o);
      else if (o.status === 'Delivered' || o.status === 'Cancelled') groups.completed.push(o);
    });
    return groups;
  }, [realOrders]);

  const handleUpdateStatus = (id: string, newStatus: string) => {
    if (!db) return;
    const orderRef = doc(db, 'orders', id);
    updateDoc(orderRef, { status: newStatus })
      .then(() => {
        if (user) {
          const staffRef = doc(db, 'admins', user.uid);
          updateDoc(staffRef, {
            'stats.kitchenUpdates': increment(1),
            'stats.ordersHandled': increment(1)
          }).catch(err => console.warn("Failed to update staff stats", err));
        }

        playSound('success');
        toast({ title: `Order ${newStatus}` });
        if (selectedOrderForView?.id === id) {
          setSelectedOrderForView(prev => prev ? { ...prev, status: newStatus } : null);
        }
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: orderRef.path,
          operation: 'update',
          requestResourceData: { status: newStatus }
        }));
      });
  };

  const getStatusBadge = (order: any) => {
    const status = order.status;
    switch (status) {
      case 'Delivered': return <Badge className="bg-green-100 text-green-700 border-none px-3 font-black text-[9px] uppercase">Delivered</Badge>;
      case 'Cancelled': 
        return (
          <div className="flex flex-col items-end gap-1">
            <Badge className="bg-red-100 text-red-700 border-none px-3 font-black text-[9px] uppercase">Cancelled</Badge>
            {order.cancelledBy === 'Customer' && (
              <span className="text-[7px] font-black text-red-500 uppercase tracking-tighter italic">By Customer</span>
            )}
          </div>
        );
      case 'Pending': return <Badge className="bg-blue-100 text-blue-700 border-none px-3 font-black text-[9px] uppercase">New</Badge>;
      case 'Preparing': return <Badge className="bg-orange-100 text-orange-700 border-none px-3 font-black text-[9px] uppercase">Cooking</Badge>;
      case 'Out for Delivery': return <Badge className="bg-purple-100 text-purple-700 border-none px-3 font-black text-[9px] uppercase">Transit</Badge>;
      default: return <Badge variant="outline" className="px-3 font-black text-[9px] uppercase">{status}</Badge>;
    }
  }

  const getOrderTypeBadge = (type: string) => {
    switch (type) {
      case 'Online': 
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-[7px] font-black uppercase px-1.5 py-0 gap-1"><Globe className="w-2 h-2" /> Online</Badge>;
      case 'Dine-In': 
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-100 text-[7px] font-black uppercase px-1.5 py-0 gap-1"><Utensils className="w-2 h-2" /> Dine-In</Badge>;
      case 'Take Away': 
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-100 text-[7px] font-black uppercase px-1.5 py-0 gap-1"><Package className="w-2 h-2" /> Take Away</Badge>;
      default: 
        return <Badge variant="outline" className="text-[7px] font-black uppercase px-1.5 py-0">{type || 'Order'}</Badge>;
    }
  }

  const availableTabs = useMemo(() => {
    if (activeView === 'kitchen') return ['kitchen'];
    if (activeView === 'cashier') return ['overview', 'billing', 'orders'];
    return ['overview', 'users', 'billing', 'orders', 'products', 'coupons', 'staff', 'settings'];
  }, [activeView]);

  return (
    <section className="bg-zinc-50 dark:bg-zinc-950 min-h-screen pb-20">
      <NewOrderPopups 
        pendingOrders={orderGroups.pending} 
        onViewDetails={(order) => setSelectedOrderForView(order)} 
        onUpdateStatus={handleUpdateStatus}
      />
      
      <div className="container mx-auto px-4 pt-8">
        <Tabs defaultValue={availableTabs[0]} className="space-y-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <TabsList className="bg-white dark:bg-zinc-900 p-1 rounded-full border w-full lg:w-fit flex shadow-sm overflow-x-auto scrollbar-hide">
              {availableTabs.includes('overview') && (
                <TabsTrigger value="overview" className="px-6 py-2.5 font-black uppercase text-[9px] tracking-widest rounded-full gap-2 shrink-0">
                  <BarChart3 className="w-3.5 h-3.5" /> Analytics
                </TabsTrigger>
              )}
              {availableTabs.includes('users') && (
                <TabsTrigger value="users" className="px-6 py-2.5 font-black uppercase text-[9px] tracking-widest rounded-full gap-2 shrink-0">
                  <Users className="w-3.5 h-3.5" /> Customers
                </TabsTrigger>
              )}
              {availableTabs.includes('billing') && (
                <TabsTrigger value="billing" className="px-6 py-2.5 font-black uppercase text-[9px] tracking-widest rounded-full gap-2 shrink-0">
                  <Receipt className="w-3.5 h-3.5" /> Billing
                </TabsTrigger>
              )}
              {availableTabs.includes('kitchen') && (
                <TabsTrigger value="kitchen" className="px-6 py-2.5 font-black uppercase text-[9px] tracking-widest rounded-full gap-2 shrink-0">
                  <ChefHat className="w-3.5 h-3.5" /> Kitchen
                </TabsTrigger>
              )}
              {availableTabs.includes('orders') && (
                <TabsTrigger value="orders" className="px-6 py-2.5 font-black uppercase text-[9px] tracking-widest rounded-full gap-2 relative shrink-0">
                  <ShoppingBag className="w-3.5 h-3.5" /> Orders
                  {orderGroups.pending.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse border-2 border-white dark:border-zinc-900" />
                  )}
                </TabsTrigger>
              )}
              {availableTabs.includes('products') && (
                <TabsTrigger value="products" className="px-6 py-2.5 font-black uppercase text-[9px] tracking-widest rounded-full gap-2 shrink-0">
                  <LayoutGrid className="w-3.5 h-3.5" /> Products
                </TabsTrigger>
              )}
              {availableTabs.includes('coupons') && (
                <TabsTrigger value="coupons" className="px-6 py-2.5 font-black uppercase text-[9px] tracking-widest rounded-full gap-2 shrink-0">
                  <TicketPercent className="w-3.5 h-3.5" /> Coupons
                </TabsTrigger>
              )}
              {availableTabs.includes('staff') && (
                <TabsTrigger value="staff" className="px-6 py-2.5 font-black uppercase text-[9px] tracking-widest rounded-full gap-2 shrink-0">
                  <UserPlus className="w-3.5 h-3.5" /> Staff
                </TabsTrigger>
              )}
              {availableTabs.includes('settings') && (
                <TabsTrigger value="settings" className="px-6 py-2.5 font-black uppercase text-[9px] tracking-widest rounded-full gap-2 shrink-0">
                  <Settings className="w-3.5 h-3.5" /> Settings
                </TabsTrigger>
              )}
            </TabsList>

            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className={cn("rounded-xl h-10 gap-2 font-black uppercase text-[10px] tracking-widest", !isAdminMuted && "bg-primary text-white border-none")}
                onClick={toggleAdminMute}
              >
                {isAdminMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {isAdminMuted ? "Muted" : "Audio Active"}
              </Button>
            </div>
          </div>

          <TabsContent value="overview">
             <DashboardAnalysis orders={realOrders || []} products={dbMenu || []} />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="billing">
            <BillingSystem products={dbMenu || []} orders={realOrders || []} />
          </TabsContent>

          <TabsContent value="kitchen">
            <KitchenSystem orders={realOrders || []} onUpdateStatus={handleUpdateStatus} />
          </TabsContent>

          <TabsContent value="orders">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[
                { id: 'pending', label: 'Incoming', icon: BellRing, color: 'text-primary' },
                { id: 'preparing', label: 'In Kitchen', icon: ChefHat, color: 'text-orange-500' },
                { id: 'completed', label: 'Archive', icon: Package, color: 'text-muted-foreground' }
              ].map((group) => (
                <div key={group.id} className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <group.icon className={cn("w-4 h-4", group.color)} />
                      <h3 className="font-black uppercase tracking-widest text-[10px] opacity-60">{group.label}</h3>
                    </div>
                    <Badge variant="secondary" className="rounded-full px-2 font-black text-[9px]">{orderGroups[group.id as keyof typeof orderGroups].length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {orderGroups[group.id as keyof typeof orderGroups].map((order) => (
                      <Card 
                        key={order.id} 
                        className="rounded-[1.2rem] border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden group hover:shadow-lg transition-all cursor-pointer"
                        onClick={() => setSelectedOrderForView(order)}
                      >
                        <div className={cn(
                          "h-1.5 w-full", 
                          order.status === 'Pending' ? "bg-primary" : 
                          order.status === 'Preparing' ? "bg-orange-500" : 
                          order.status === 'Cancelled' ? "bg-red-500" : "bg-green-500"
                        )} />
                        <div className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-[9px] font-black uppercase text-primary">#{order.orderId}</p>
                                {getOrderTypeBadge(order.orderType)}
                              </div>
                              <h4 className="text-xs font-black truncate">{order.customerName}</h4>
                            </div>
                            <p className="text-sm font-black text-primary">₹{order.total}</p>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-dashed">
                            {getStatusBadge(order)}
                            <span className="text-[8px] font-bold text-muted-foreground opacity-50 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="coupons">
             <CouponManager />
          </TabsContent>

          <TabsContent value="staff">
            <StaffManagement />
          </TabsContent>

          <TabsContent value="settings">
            <StoreSettings />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedOrderForView} onOpenChange={(open) => {
        if (!open) setSelectedOrderForView(null);
      }}>
        <DialogContent className="max-w-2xl rounded-[2rem] p-0 overflow-hidden border-none shadow-3xl bg-white dark:bg-zinc-900">
          <DialogHeader className="sr-only">
            <DialogTitle>Order Details for #{selectedOrderForView?.orderId}</DialogTitle>
          </DialogHeader>
          {selectedOrderForView && (
            <>
              <div className={cn(
                "p-8 text-white",
                selectedOrderForView.status === 'Cancelled' ? "bg-red-600" : "bg-primary"
              )}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <p className="text-[10px] font-black uppercase opacity-70">Order Number</p>
                       {getOrderTypeBadge(selectedOrderForView.orderType)}
                    </div>
                    <h2 className="text-3xl font-black font-headline">#{selectedOrderForView.orderId}</h2>
                    {selectedOrderForView.status === 'Cancelled' && (
                       <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">
                         Cancelled by {selectedOrderForView.cancelledBy || 'System'}
                       </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase opacity-70">Total Value</p>
                    <p className="text-3xl font-black font-headline">₹{selectedOrderForView.total}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase opacity-40">Cart Items</h5>
                    <div className="space-y-3">
                      {selectedOrderForView.items?.map((item: any, i: number) => (
                        <div key={i} className="bg-secondary/20 dark:bg-zinc-800 p-3 rounded-xl space-y-1">
                          <div className="flex justify-between items-center text-xs font-black">
                            <span>{item.name} x{item.quantity}</span>
                            <span className="text-primary">₹{item.price * item.quantity}</span>
                          </div>
                          {item.customization && (
                            <div className="flex items-center gap-1 text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                               <Settings2 className="w-2.5 h-2.5" />
                               {item.customization.size} • {item.customization.temp} • Sugar: {item.customization.sugar}
                               {item.customization.addons?.length > 0 && ` • +${item.customization.addons.join(', ')}`}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase opacity-40">Client Info</h5>
                    <div className="space-y-2">
                      <p className="text-xs font-bold"><User className="inline w-3 h-3 mr-1" /> {selectedOrderForView.customerName}</p>
                      <p className="text-xs font-medium opacity-60"><MapPin className="inline w-3 h-3 mr-1" /> {selectedOrderForView.address || (selectedOrderForView.orderType === 'Dine-In' ? 'Table Service' : 'In-Store Pickup')}</p>
                      <p className="text-xs font-bold text-primary"><ShoppingBag className="inline w-3 h-3 mr-1" /> Source: {selectedOrderForView.orderType || 'Online'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="p-6 bg-secondary/30 dark:bg-zinc-800 flex gap-3">
                {selectedOrderForView.status === 'Pending' && (
                  <>
                    <Button className="flex-1 rounded-xl h-14 bg-primary text-white font-black uppercase text-[10px]" onClick={() => handleUpdateStatus(selectedOrderForView.id, 'Preparing')}>Accept</Button>
                    <Button variant="destructive" className="flex-1 rounded-xl h-14 font-black uppercase text-[10px]" onClick={() => handleUpdateStatus(selectedOrderForView.id, 'Cancelled')}>Reject</Button>
                  </>
                )}
                {selectedOrderForView.status === 'Preparing' && (
                  <Button className="flex-1 rounded-xl h-14 bg-orange-500 text-white font-black uppercase text-[10px]" onClick={() => handleUpdateStatus(selectedOrderForView.id, 'Delivered')}>Complete</Button>
                )}
                <Button variant="outline" className="flex-1 rounded-xl h-14 font-black uppercase text-[10px]" onClick={() => setSelectedOrderForView(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
