
"use client"
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  IndianRupee, Sparkles, Loader2, 
  Package, Clock, CheckCircle2,
  Megaphone, LayoutDashboard, Trash2, Plus, Edit2, Link as LinkIcon,
  MapPin, Phone, Database, Info, Coffee,
  Receipt, Calculator, History, Printer, Search,
  Store, AlertCircle, Ban, Truck, ChefHat, Volume2, VolumeX
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CATEGORIES, MENU_ITEMS } from '@/app/lib/menu-data';
import { dailySpecialGenerator } from '@/ai/flows/daily-special-generator';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, limit, doc, updateDoc, deleteDoc, setDoc, serverTimestamp, writeBatch, orderBy, onSnapshot } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { DashboardAnalysis } from './DashboardAnalysis';
import { BillingSystem } from './BillingSystem';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/use-sound';

export const AdminSection = () => {
  const db = useFirestore();
  const { playSound, isAdminMuted, toggleAdminMute } = useSound();
  
  const ordersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100));
  }, [db]);
  const { data: realOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);

  const menuQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'products'));
  }, [db]);
  const { data: dbMenu, loading: menuLoading } = useCollection<any>(menuQuery);

  // Sound logic for new orders
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const order = change.doc.data();
          // Only ping for orders created in the last minute to avoid history pings on load
          if (order.createdAt && (Date.now() - order.createdAt.toMillis() < 60000)) {
            playSound('ping');
            toast({ title: "New Order Received!", description: `From ${order.customerName}` });
          }
        }
      });
    });
    return () => unsubscribe();
  }, [db, playSound]);

  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<any>(null);
  const [selectedPromoDish, setSelectedPromoDish] = useState<any>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [menuFormData, setMenuFormData] = useState({
    name: '', description: '', price: '', category: 'Veg Maggie', imageUrl: '', isVeg: true, isAvailable: true, rating: '4.5', isBeverage: false
  });

  const handleUpdateStatus = (id: string, newStatus: string) => {
    if (!db) return;
    const orderRef = doc(db, 'orders', id);
    updateDoc(orderRef, { status: newStatus }).then(() => {
      playSound('success');
      toast({ title: `Order set to ${newStatus}` });
    }).catch(async (e) => {
      playSound('warning');
      errorEmitter.emit('permission-error', new FirestorePermissionError({ 
        path: orderRef.path, operation: 'update', requestResourceData: { status: newStatus }
      }));
    });
  };

  const resetForm = () => {
    setEditingItem(null);
    setMenuFormData({ name: '', description: '', price: '', category: 'Veg Maggie', imageUrl: '', isVeg: true, isAvailable: true, rating: '4.5', isBeverage: false });
  };

  const handleSeedMenu = async () => {
    if (!db) return;
    setIsSeeding(true);
    try {
      const batch = writeBatch(db);
      MENU_ITEMS.forEach((item) => {
        const itemRef = doc(db, 'products', item.id);
        batch.set(itemRef, { ...item, createdAt: serverTimestamp() }, { merge: true });
      });
      await batch.commit();
      playSound('pop');
      toast({ title: "Inventory Seeded Successfully" });
    } catch (error) {
      playSound('warning');
      toast({ variant: "destructive", title: "Seeding Failed" });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSaveMenuItem = () => {
    if (!db || !menuFormData.name || !menuFormData.imageUrl) {
      playSound('warning');
      toast({ variant: "destructive", title: "Incomplete Data" });
      return;
    }
    
    setSaveLoading(true);
    const itemId = editingItem ? editingItem.id : `PROD-${Date.now()}`;
    const itemRef = doc(db, 'products', itemId);
    const finalData = {
      id: itemId,
      name: menuFormData.name.trim(),
      description: menuFormData.description.trim(),
      price: Number(menuFormData.price) || 0,
      category: menuFormData.category,
      imageUrl: menuFormData.imageUrl.trim(),
      isVeg: menuFormData.isVeg,
      isAvailable: menuFormData.isAvailable,
      isBeverage: menuFormData.isBeverage,
      rating: Number(menuFormData.rating) || 4.5,
      createdAt: editingItem?.createdAt || serverTimestamp()
    };

    setDoc(itemRef, finalData, { merge: true })
      .then(() => {
        setSaveLoading(false);
        playSound('pop');
        toast({ title: "Inventory Updated" });
        setIsMenuDialogOpen(false);
        resetForm();
      })
      .catch(async (e) => {
        setSaveLoading(false);
        playSound('warning');
        errorEmitter.emit('permission-error', new FirestorePermissionError({ 
          path: itemRef.path, operation: 'write', requestResourceData: finalData 
        }));
      });
  };

  const orderGroups = useMemo(() => {
    const groups = {
      pending: [] as any[],
      preparing: [] as any[],
      completed: [] as any[]
    };
    realOrders?.forEach(o => {
      if (o.status === 'Pending') groups.pending.push(o);
      else if (o.status === 'Preparing') groups.preparing.push(o);
      else if (o.status === 'Delivered') groups.completed.push(o);
    });
    return groups;
  }, [realOrders]);

  const hideVegOption = ['Tea', 'Coffee', 'Ice creams'].includes(menuFormData.category);

  return (
    <section className="py-6 md:py-12 bg-secondary/5 min-h-screen">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary rounded-3xl shadow-2xl flex items-center justify-center text-white transform rotate-3">
              <LayoutDashboard className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black font-headline">Ezzy<span className="text-primary italic">Console</span></h1>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">System Operations Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className={cn("rounded-xl h-10 px-4 font-black uppercase text-[9px] tracking-widest gap-2", isAdminMuted ? "text-muted-foreground" : "text-primary border-primary")}
              onClick={toggleAdminMute}
            >
              {isAdminMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {isAdminMuted ? "Sound Off" : "Sound On"}
            </Button>
            <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200 px-4 py-2 uppercase font-black text-[9px]">Live Data Uplink</Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-10">
          <TabsList className="bg-white p-1 rounded-3xl border w-full flex shadow-sm">
            <TabsTrigger value="overview" className="flex-1 py-4 font-black uppercase text-[10px] rounded-2xl">Analysis</TabsTrigger>
            <TabsTrigger value="billing" className="flex-1 py-4 font-black uppercase text-[10px] gap-2 rounded-2xl"><Receipt className="w-4 h-4" /> Billing</TabsTrigger>
            <TabsTrigger value="orders" className="flex-1 py-4 font-black uppercase text-[10px] rounded-2xl">Live Orders</TabsTrigger>
            <TabsTrigger value="inventory" className="flex-1 py-4 font-black uppercase text-[10px] rounded-2xl">Inventory</TabsTrigger>
            <TabsTrigger value="marketing" className="flex-1 py-4 font-black uppercase text-[10px] rounded-2xl"><Sparkles className="w-4 h-4" /> AI Labs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
             <DashboardAnalysis orders={realOrders || []} products={dbMenu || []} />
          </TabsContent>

          <TabsContent value="billing">
            <BillingSystem products={dbMenu || []} orders={realOrders || []} />
          </TabsContent>

          <TabsContent value="orders">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {['pending', 'preparing', 'completed'].map((statusKey) => (
                <div key={statusKey} className="space-y-6">
                  <div className="flex items-center justify-between px-4">
                    <h3 className="font-black uppercase tracking-widest text-xs opacity-50">{statusKey}</h3>
                    <Badge className="bg-secondary text-foreground rounded-full h-6 w-6 flex items-center justify-center p-0">{orderGroups[statusKey as keyof typeof orderGroups].length}</Badge>
                  </div>
                  <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
                    {orderGroups[statusKey as keyof typeof orderGroups].map((order) => (
                      <Card key={order.id} className="rounded-[2.5rem] border-none shadow-xl bg-white group hover:shadow-2xl transition-all">
                        <CardContent className="p-6 md:p-8">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <Badge className="bg-primary/10 text-primary border-none text-[9px] uppercase font-black px-3 py-1 mb-2">#{order.orderId}</Badge>
                              <h4 className="text-xl font-black">{order.customerName}</h4>
                              <p className="text-[10px] font-bold text-muted-foreground">{order.customerPhone}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black text-primary italic">₹{order.total}</p>
                            </div>
                          </div>
                          <div className="space-y-2 border-t pt-4">
                            {order.items?.map((item: any, i: number) => (
                              <div key={i} className="flex justify-between text-[11px] font-bold">
                                <span>{item.name} <span className="text-primary">x{item.quantity}</span></span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-6 flex gap-2">
                            {order.status === 'Pending' && (
                              <Button size="sm" className="flex-1 rounded-xl font-black text-[10px] uppercase h-10" onClick={() => handleUpdateStatus(order.id, 'Preparing')}>
                                <ChefHat className="w-3.5 h-3.5 mr-2" /> Prepare
                              </Button>
                            )}
                            {order.status === 'Preparing' && (
                              <Button size="sm" className="flex-1 rounded-xl font-black text-[10px] uppercase h-10 bg-orange-500" onClick={() => handleUpdateStatus(order.id, 'Delivered')}>
                                <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Complete
                              </Button>
                            )}
                            {order.status !== 'Delivered' && (
                              <Button size="icon" variant="ghost" className="h-10 w-10 text-destructive rounded-xl" onClick={() => handleUpdateStatus(order.id, 'Cancelled')}>
                                <Ban className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-10">
            <div className="flex gap-4">
              <Button onClick={() => { resetForm(); setIsMenuDialogOpen(true); }} className="rounded-2xl h-16 px-10 font-black uppercase tracking-widest text-[11px] gap-3 bg-primary">
                <Plus className="w-6 h-6" /> Add Product
              </Button>
              <Button onClick={handleSeedMenu} disabled={isSeeding} variant="outline" className="rounded-2xl h-16 px-10 font-black uppercase tracking-widest text-[11px] border-2">
                {isSeeding ? <Loader2 className="w-6 h-6 animate-spin" /> : <Database className="w-6 h-6 mr-2" />}
                Reset Inventory
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {dbMenu?.map((item: any) => (
                <Card key={item.id} className="rounded-[3rem] border-none shadow-xl overflow-hidden bg-white">
                  <div className="h-48 relative">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    <Badge className="absolute top-4 left-4 bg-white/90 text-foreground border-none text-[8px] uppercase font-black">{item.category}</Badge>
                  </div>
                  <CardContent className="p-6">
                    <h4 className="font-black text-lg truncate mb-2">{item.name}</h4>
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-xl font-black text-primary italic">₹{item.price}</p>
                      <Badge variant="outline" className={cn("text-[8px] uppercase font-black", item.isAvailable ? "text-green-600" : "text-red-600")}>
                        {item.isAvailable ? "Available" : "Out"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" className="flex-1 rounded-xl h-10 font-black text-[9px] uppercase" onClick={() => { setEditingItem(item); setMenuFormData({ ...item, price: item.price.toString() }); setIsMenuDialogOpen(true); }}>
                        <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit
                      </Button>
                      <Button variant="ghost" className="h-10 w-10 text-destructive rounded-xl" onClick={() => deleteDoc(doc(db!, 'products', item.id))}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="marketing">
             <Card className="rounded-[4rem] border-none shadow-3xl bg-white p-12 md:p-24 overflow-hidden relative">
                <div className="max-w-4xl relative z-10">
                  <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-12 flex items-center gap-6">
                    <Sparkles className="w-12 h-12 text-primary" /> AI Synthesis
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
                    {dbMenu?.slice(0, 12).map((item: any) => (
                      <button key={item.id} onClick={() => setSelectedPromoDish(item)} className={cn("p-6 rounded-[2rem] border-2 text-[10px] font-black uppercase transition-all", selectedPromoDish?.id === item.id ? "border-primary bg-primary text-white" : "border-muted bg-white")}>
                        {item.name}
                      </button>
                    ))}
                  </div>
                  <Button size="lg" className="rounded-[2.5rem] h-20 px-16 font-black uppercase text-[12px] gap-4 bg-primary" onClick={async () => {
                      if (!selectedPromoDish) return;
                      setPromoLoading(true);
                      try {
                        const res = await dailySpecialGenerator({ dishName: selectedPromoDish.name, basePrice: selectedPromoDish.price, discountPercent: 15 });
                        setPromoResult(res);
                        playSound('pop');
                      } finally { setPromoLoading(false); }
                    }} disabled={promoLoading || !selectedPromoDish}>
                    {promoLoading ? <Loader2 className="animate-spin w-8 h-8" /> : <Megaphone className="w-8 h-8" />} Generate Viral Copy
                  </Button>
                  {promoResult && (
                    <div className="mt-20 p-12 bg-primary/5 rounded-[4rem] border-2 border-primary/10 space-y-8 animate-in zoom-in">
                      <h4 className="text-4xl font-black">{promoResult.promoTitle} {promoResult.emoji}</h4>
                      <p className="text-2xl font-medium italic leading-relaxed opacity-80">"{promoResult.promoDescription}"</p>
                    </div>
                  )}
                </div>
             </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[3rem] p-10 bg-white">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black font-headline uppercase">{editingItem ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Dish Name</Label>
                <Input value={menuFormData.name} onChange={e => setMenuFormData({...menuFormData, name: e.target.value})} className="h-14 rounded-2xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Price (₹)</Label>
                <Input type="number" value={menuFormData.price} onChange={e => setMenuFormData({...menuFormData, price: e.target.value})} className="h-14 rounded-2xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Category</Label>
                <select value={menuFormData.category} onChange={e => setMenuFormData({...menuFormData, category: e.target.value})} className="w-full h-14 rounded-2xl border bg-white px-6 text-[11px] font-black uppercase outline-none">
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Image URL</Label>
                <Input value={menuFormData.imageUrl} onChange={e => setMenuFormData({...menuFormData, imageUrl: e.target.value})} className="h-14 rounded-2xl" />
              </div>
            </div>
            <div className="flex items-center justify-between p-6 bg-secondary/30 rounded-3xl">
              <div className="flex items-center gap-3">
                <Switch checked={menuFormData.isAvailable} onCheckedChange={(checked) => setMenuFormData({...menuFormData, isAvailable: checked})} />
                <span className="text-xs font-black uppercase">Stock Available</span>
              </div>
              {!hideVegOption && (
                <div className="flex items-center gap-3">
                  <Switch checked={menuFormData.isVeg} onCheckedChange={(checked) => setMenuFormData({...menuFormData, isVeg: checked})} />
                  <span className="text-xs font-black uppercase">Vegetarian</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-4 mt-10">
            <Button variant="outline" className="flex-1 h-16 rounded-[1.5rem] font-black uppercase" onClick={() => setIsMenuDialogOpen(false)}>Cancel</Button>
            <Button className="flex-1 h-16 rounded-[1.5rem] font-black uppercase bg-primary" onClick={handleSaveMenuItem} disabled={saveLoading}>
              {saveLoading ? <Loader2 className="animate-spin" /> : 'Confirm Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};
