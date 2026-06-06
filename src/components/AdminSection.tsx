"use client"
import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  IndianRupee, Zap, Loader2, 
  Package, Clock, ChefHat, 
  Trash2, Plus, Edit2, 
  Database, Receipt, ShoppingBag, 
  Volume2, VolumeX, BellRing,
  MapPin, User, Settings, CheckCircle2,
  Users, UserPlus, Globe, Utensils, Truck,
  TicketPercent
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, limit, doc, updateDoc, deleteDoc, setDoc, serverTimestamp, orderBy, increment } from 'firebase/firestore';
import { DashboardAnalysis } from './DashboardAnalysis';
import { BillingSystem } from './BillingSystem';
import { StoreSettings } from './StoreSettings';
import { NewOrderPopups } from './NewOrderPopups';
import { KitchenSystem } from './KitchenSystem';
import { StaffManagement } from './StaffManagement';
import { CouponManager } from './CouponManager';
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
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100));
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

  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [menuFormData, setMenuFormData] = useState({
    name: '', description: '', price: '', category: 'Veg Maggie', imageUrl: '', isVeg: true, isAvailable: true, rating: '4.5', isBeverage: false
  });

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

  const handleSaveMenuItem = () => {
    if (!db || !menuFormData.name || !menuFormData.imageUrl) return;
    setSaveLoading(true);
    const itemId = editingItem ? editingItem.id : `PROD-${Date.now()}`;
    const itemRef = doc(db, 'products', itemId);
    const finalData = {
      ...menuFormData,
      id: itemId,
      price: Number(menuFormData.price),
      rating: Number(menuFormData.rating),
      createdAt: editingItem?.createdAt || serverTimestamp()
    };
    
    setDoc(itemRef, finalData, { merge: true })
      .then(() => {
        setSaveLoading(false);
        playSound('pop');
        setIsMenuDialogOpen(false);
      })
      .catch(async (error) => {
        setSaveLoading(false);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: itemRef.path,
          operation: editingItem ? 'update' : 'create',
          requestResourceData: finalData
        }));
      });
  };

  const handleDeleteItem = (id: string) => {
    if (!db) return;
    const itemRef = doc(db, 'products', id);
    deleteDoc(itemRef).catch(async (error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: itemRef.path,
        operation: 'delete'
      }));
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered': return <Badge className="bg-green-100 text-green-700 border-none px-3 font-black text-[9px] uppercase">Delivered</Badge>;
      case 'Cancelled': return <Badge className="bg-red-100 text-red-700 border-none px-3 font-black text-[9px] uppercase">Denied</Badge>;
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
    return ['overview', 'billing', 'orders', 'inventory', 'coupons', 'staff', 'settings'];
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
                  <Zap className="w-3.5 h-3.5" /> Analysis
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
              {availableTabs.includes('inventory') && (
                <TabsTrigger value="inventory" className="px-6 py-2.5 font-black uppercase text-[9px] tracking-widest rounded-full gap-2 shrink-0">
                  <Database className="w-3.5 h-3.5" /> Inventory
                </TabsTrigger>
              )}
              {availableTabs.includes('coupons') && (
                <TabsTrigger value="coupons" className="px-6 py-2.5 font-black uppercase text-[9px] tracking-widest rounded-full gap-2 shrink-0">
                  <TicketPercent className="w-3.5 h-3.5" /> Coupons
                </TabsTrigger>
              )}
              {availableTabs.includes('staff') && (
                <TabsTrigger value="staff" className="px-6 py-2.5 font-black uppercase text-[9px] tracking-widest rounded-full gap-2 shrink-0">
                  <Users className="w-3.5 h-3.5" /> Staff
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
                            {getStatusBadge(order.status)}
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

          <TabsContent value="inventory" className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black font-headline uppercase tracking-tighter">Inventory</h2>
              <Button onClick={() => { setEditingItem(null); setMenuFormData({ name: '', description: '', price: '', category: 'Veg Maggie', imageUrl: '', isVeg: true, isAvailable: true, rating: '4.5', isBeverage: false }); setIsMenuDialogOpen(true); }} className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px] gap-2 bg-primary">
                <Plus className="w-5 h-5" /> Add New
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {dbMenu?.map((item: any) => (
                <Card key={item.id} className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-white dark:bg-zinc-900">
                  <div className="h-40 relative">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <CardContent className="p-5 space-y-3">
                    <h4 className="font-black text-sm truncate">{item.name}</h4>
                    <div className="flex justify-between items-center">
                      <p className="text-xl font-black text-primary italic">₹{item.price}</p>
                      <Badge variant="outline" className={cn("text-[8px] uppercase font-black px-2 py-0.5", item.isAvailable ? "text-green-600 border-green-200" : "text-red-600 border-red-200")}>
                        {item.isAvailable ? "Active" : "OOS"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" className="flex-1 rounded-lg h-9 font-black text-[9px] uppercase bg-secondary/30" onClick={() => { setEditingItem(item); setMenuFormData({ ...item, price: item.price.toString() }); setIsMenuDialogOpen(true); }}>
                        <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit
                      </Button>
                      <Button variant="ghost" className="h-9 w-9 text-destructive" onClick={() => handleDeleteItem(item.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
              <div className="p-8 bg-primary text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <p className="text-[10px] font-black uppercase opacity-70">Order Number</p>
                       {getOrderTypeBadge(selectedOrderForView.orderType)}
                    </div>
                    <h2 className="text-3xl font-black font-headline">#{selectedOrderForView.orderId}</h2>
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
                    <div className="space-y-2">
                      {selectedOrderForView.items?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-xs font-bold">
                          <span>{item.name} x{item.quantity}</span>
                          <span className="text-primary">₹{item.price * item.quantity}</span>
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
                  <Button className="flex-1 rounded-xl h-14 bg-primary text-white font-black uppercase text-[10px]" onClick={() => handleUpdateStatus(selectedOrderForView.id, 'Preparing')}>Accept</Button>
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

      <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
        <DialogContent className="max-w-xl rounded-[2.5rem] p-8 border-none bg-white dark:bg-zinc-900 shadow-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-headline">{editingItem ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40">Name</Label>
                <Input value={menuFormData.name} onChange={e => setMenuFormData({...menuFormData, name: e.target.value})} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40">Price</Label>
                <Input type="number" value={menuFormData.price} onChange={e => setMenuFormData({...menuFormData, price: e.target.value})} className="h-12 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase opacity-40">Image URL</Label>
              <Input value={menuFormData.imageUrl} onChange={e => setMenuFormData({...menuFormData, imageUrl: e.target.value})} className="h-12 rounded-xl" />
            </div>
            <Button className="w-full h-14 rounded-xl font-black uppercase bg-primary text-white mt-4" onClick={handleSaveMenuItem} disabled={saveLoading}>
              {saveLoading ? <Loader2 className="animate-spin" /> : 'Save Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};
