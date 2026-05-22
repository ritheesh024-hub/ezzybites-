
"use client"
import React, { useState, useMemo, useEffect } from 'react';
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
  Megaphone, LayoutDashboard, Trash2, Plus, Edit2, 
  Database, Coffee, Receipt, ShoppingBag, Zap,
  Ban, ChefHat, Volume2, VolumeX, BellRing,
  MapPin, User, FileText, Calendar
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CATEGORIES } from '@/app/lib/menu-data';
import { dailySpecialGenerator } from '@/ai/flows/daily-special-generator';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, limit, doc, updateDoc, deleteDoc, setDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { DashboardAnalysis } from './DashboardAnalysis';
import { BillingSystem } from './BillingSystem';
import { NewOrderPopups } from './NewOrderPopups';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/use-sound';

export const AdminSection = () => {
  const db = useFirestore();
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

  // Persistent Ringing for Pending Orders
  useEffect(() => {
    if (isAdminMuted || orderGroups.pending.length === 0) return;
    const ringInterval = setInterval(() => playSound('ping'), 8000);
    playSound('ping');
    return () => clearInterval(ringInterval);
  }, [orderGroups.pending.length, isAdminMuted, playSound]);

  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<any>(null);
  const [selectedPromoDish, setSelectedPromoDish] = useState<any>(null);

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
      toast({ title: `Order ${newStatus}` });
      if (selectedOrderForView?.id === id) {
        setSelectedOrderForView(prev => prev ? { ...prev, status: newStatus } : null);
      }
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
    setDoc(itemRef, finalData, { merge: true }).then(() => {
      setSaveLoading(false);
      playSound('pop');
      setIsMenuDialogOpen(false);
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 font-black text-[9px] uppercase">Delivered</Badge>;
      case 'Cancelled': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none px-3 font-black text-[9px] uppercase">Denied</Badge>;
      case 'Pending': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-3 font-black text-[9px] uppercase">New</Badge>;
      case 'Preparing': return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none px-3 font-black text-[9px] uppercase">Cooking</Badge>;
      case 'Out for Delivery': return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none px-3 font-black text-[9px] uppercase">Transit</Badge>;
      default: return <Badge variant="outline" className="px-3 font-black text-[9px] uppercase">{status}</Badge>;
    }
  }

  const getTypeBadge = (order: any) => {
    if (order.isStoreBill) {
      const type = order.orderType || 'Counter';
      return (
        <Badge variant="outline" className={cn(
          "px-2 font-black text-[8px] uppercase border-dashed",
          type === 'Dine-In' ? "text-blue-500 border-blue-200" : "text-amber-500 border-amber-200"
        )}>
          {type}
        </Badge>
      );
    }
    return <Badge variant="outline" className="px-2 font-black text-[8px] uppercase border-primary/20 text-primary">Online</Badge>;
  }

  return (
    <section className="bg-secondary/5 min-h-screen pb-20">
      <NewOrderPopups 
        pendingOrders={orderGroups.pending} 
        onViewDetails={(order) => setSelectedOrderForView(order)} 
        onUpdateStatus={handleUpdateStatus}
      />
      
      {/* ADMIN HEADER */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-headline tracking-tight">Ezzy<span className="text-primary italic">Ops</span></h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">System Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className={cn("rounded-xl h-10 gap-2 font-black uppercase text-[10px] tracking-widest transition-all", !isAdminMuted && "bg-primary text-white border-none")}
              onClick={toggleAdminMute}
            >
              {isAdminMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {isAdminMuted ? "Muted" : "Audio Active"}
            </Button>
            <Badge className="bg-green-100 text-green-700 border-none uppercase font-black text-[9px] px-3 py-1">System Live</Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-8">
        <Tabs defaultValue="overview" className="space-y-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <TabsList className="bg-white p-1 rounded-full border w-full lg:w-fit flex shadow-sm">
              {[
                { id: 'overview', label: 'Analysis', icon: Zap },
                { id: 'billing', label: 'Billing POS', icon: Receipt },
                { id: 'orders', label: 'Live Orders', icon: ShoppingBag },
                { id: 'inventory', label: 'Inventory', icon: Database },
                { id: 'marketing', label: 'AI Labs', icon: Sparkles },
              ].map(tab => (
                <TabsTrigger key={tab.id} value={tab.id} className="flex-1 lg:flex-none px-6 py-2.5 font-black uppercase text-[9px] tracking-widest rounded-full gap-2 relative">
                  <tab.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.id === 'orders' && orderGroups.pending.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse border-2 border-white" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="flex -space-x-2">
                {dbMenu?.slice(0, 3).map((m, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-secondary overflow-hidden">
                    <img src={m.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{dbMenu?.length || 0} Products Active</p>
            </div>
          </div>

          <TabsContent value="overview">
             <DashboardAnalysis orders={realOrders || []} products={dbMenu || []} />
          </TabsContent>

          <TabsContent value="billing">
            <BillingSystem products={dbMenu || []} orders={realOrders || []} />
          </TabsContent>

          <TabsContent value="orders">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[
                { id: 'pending', label: 'Incoming Orders', icon: BellRing, color: 'text-primary' },
                { id: 'preparing', label: 'In the Kitchen', icon: ChefHat, color: 'text-orange-500' },
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
                    {orderGroups[group.id as keyof typeof orderGroups].length === 0 ? (
                      <div className="bg-secondary/20 rounded-[1.5rem] p-8 text-center border-2 border-dashed border-muted/40">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-10" />
                        <p className="text-[9px] font-black uppercase opacity-30">No active orders</p>
                      </div>
                    ) : (
                      orderGroups[group.id as keyof typeof orderGroups].map((order) => (
                        <Card 
                          key={order.id} 
                          className="rounded-[1.2rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-lg transition-all cursor-pointer"
                          onClick={() => setSelectedOrderForView(order)}
                        >
                          <div className={cn(
                            "h-1.5 w-full", 
                            order.status === 'Pending' ? "bg-primary" : 
                            order.status === 'Preparing' ? "bg-orange-500" : 
                            order.status === 'Cancelled' ? "bg-red-500" : "bg-green-500"
                          )} />
                          <div className="p-4 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[9px] font-black uppercase text-primary">#{order.orderId}</span>
                                  {getTypeBadge(order)}
                                </div>
                                <h4 className="text-xs font-black truncate">{order.customerName}</h4>
                              </div>
                              <p className="text-sm font-black text-primary italic">₹{order.total}</p>
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
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-8">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h2 className="text-2xl font-black font-headline uppercase tracking-tighter">Kitchen Inventory</h2>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Manage your dynamic menu items</p>
              </div>
              <Button onClick={() => { setEditingItem(null); setMenuFormData({ name: '', description: '', price: '', category: 'Veg Maggie', imageUrl: '', isVeg: true, isAvailable: true, rating: '4.5', isBeverage: false }); setIsMenuDialogOpen(true); }} className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px] gap-2 bg-primary">
                <Plus className="w-5 h-5" /> Add New
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {dbMenu?.map((item: any) => (
                <Card key={item.id} className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-white hover:scale-[1.02] transition-all">
                  <div className="h-40 relative bg-secondary">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    <Badge className="absolute top-3 left-3 bg-white/90 backdrop-blur text-foreground border-none text-[8px] uppercase font-black px-2 py-0.5 rounded-full">{item.category}</Badge>
                  </div>
                  <CardContent className="p-5 space-y-3">
                    <h4 className="font-black text-sm truncate">{item.name}</h4>
                    <div className="flex justify-between items-center">
                      <p className="text-xl font-black text-primary italic">₹{item.price}</p>
                      <Badge variant="outline" className={cn("text-[8px] uppercase font-black px-2 py-0.5 rounded-full", item.isAvailable ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-600 border-red-200")}>
                        {item.isAvailable ? "In Stock" : "Unavailable"}
                      </Badge>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button variant="ghost" className="flex-1 rounded-lg h-9 font-black text-[9px] uppercase bg-secondary/30" onClick={() => { setEditingItem(item); setMenuFormData({ ...item, price: item.price.toString() }); setIsMenuDialogOpen(true); }}>
                        <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit
                      </Button>
                      <Button variant="ghost" className="h-9 w-9 text-destructive rounded-lg bg-destructive/5 hover:bg-destructive/10" onClick={() => deleteDoc(doc(db!, 'products', item.id))}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="marketing">
             <Card className="rounded-[3rem] border-none shadow-3xl bg-white p-8 md:p-16 overflow-hidden relative">
                <div className="max-w-3xl relative z-10 space-y-10">
                  <div className="space-y-4">
                    <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">Marketing Engine</Badge>
                    <h3 className="text-3xl md:text-6xl font-black uppercase tracking-tighter leading-none">AI Marketing <br /><span className="text-primary italic">Labs</span></h3>
                    <p className="text-muted-foreground font-medium text-base">Select a dish to generate a high-impact social media promotion using Gemini AI.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {dbMenu?.slice(0, 12).map((item: any) => (
                      <button 
                        key={item.id} 
                        onClick={() => setSelectedPromoDish(item)} 
                        className={cn(
                          "p-3 rounded-xl border-2 text-[9px] font-black uppercase transition-all truncate text-center", 
                          selectedPromoDish?.id === item.id ? "border-primary bg-primary text-white shadow-lg" : "border-muted bg-white hover:border-primary/20"
                        )}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>

                  <Button 
                    size="lg" 
                    className="rounded-full h-16 px-10 font-black uppercase text-[11px] gap-3 bg-primary" 
                    onClick={async () => {
                      if (!selectedPromoDish) return;
                      setPromoLoading(true);
                      try {
                        const res = await dailySpecialGenerator({ dishName: selectedPromoDish.name, basePrice: selectedPromoDish.price, discountPercent: 20 });
                        setPromoResult(res);
                        playSound('success');
                      } finally { setPromoLoading(false); }
                    }} 
                    disabled={promoLoading || !selectedPromoDish}
                  >
                    {promoLoading ? <Loader2 className="animate-spin w-6 h-6" /> : <Sparkles className="w-6 h-6" />} Generate Promotion
                  </Button>

                  {promoResult && (
                    <div className="mt-8 p-8 bg-primary/5 rounded-[2.5rem] border-2 border-primary/10 space-y-4 animate-in zoom-in">
                      <div className="flex justify-between items-start">
                        <h4 className="text-2xl font-black">{promoResult.promoTitle} {promoResult.emoji}</h4>
                        <Badge className="bg-primary text-white font-black text-[9px] uppercase px-4 py-1">₹{promoResult.finalPrice}</Badge>
                      </div>
                      <p className="text-base font-medium italic opacity-80 leading-relaxed">"{promoResult.promoDescription}"</p>
                    </div>
                  )}
                </div>
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
             </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Standard Order Details Modal */}
      <Dialog open={!!selectedOrderForView} onOpenChange={(open) => !open && setSelectedOrderForView(null)}>
        <DialogContent className="max-w-2xl rounded-[2rem] p-0 overflow-hidden border-none shadow-3xl bg-white">
          <DialogTitle className="sr-only">Order Details for #{selectedOrderForView?.orderId}</DialogTitle>
          {selectedOrderForView && (
            <>
              <div className={cn(
                "p-8 text-white relative",
                selectedOrderForView.status === 'Cancelled' ? 'bg-destructive' : 'bg-primary'
              )}>
                <div className="flex justify-between items-center relative z-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Operation ID</p>
                    <h2 className="text-3xl font-black font-headline tracking-tighter">#{selectedOrderForView.orderId}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase opacity-70 mb-1">Total Bill</p>
                    <p className="text-3xl font-black font-headline">₹{selectedOrderForView.total}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 grid md:grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Order Items</h5>
                    <div className="space-y-2">
                      {selectedOrderForView.items?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl">
                          <div className="flex-1">
                            <p className="font-bold text-xs">{item.name}</p>
                            <p className="text-[9px] font-black text-primary">₹{item.price} x {item.quantity}</p>
                          </div>
                          <span className="font-black text-primary text-sm">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {selectedOrderForView.instructions && (
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Special Notes</h5>
                      <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-xs font-medium italic text-orange-800">
                        {selectedOrderForView.instructions}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Logistics</h5>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-[9px] font-black uppercase opacity-40">Client</p>
                          <p className="text-xs font-bold">{selectedOrderForView.customerName} ({selectedOrderForView.customerPhone})</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-[9px] font-black uppercase opacity-40">Destination</p>
                          <p className="text-xs font-bold leading-relaxed">{selectedOrderForView.address || 'Dine-in / Pickup'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="p-6 bg-secondary/30 flex flex-wrap gap-3 sm:justify-center">
                {selectedOrderForView.status === 'Pending' && (
                  <Button 
                    className="flex-1 min-w-[140px] rounded-xl h-14 bg-primary font-black uppercase text-[10px] tracking-widest"
                    onClick={() => handleUpdateStatus(selectedOrderForView.id, 'Preparing')}
                  >
                    Accept & Cook
                  </Button>
                )}
                {selectedOrderForView.status === 'Preparing' && (
                  <Button 
                    className="flex-1 min-w-[140px] rounded-xl h-14 bg-orange-500 font-black uppercase text-[10px] tracking-widest"
                    onClick={() => handleUpdateStatus(selectedOrderForView.id, 'Delivered')}
                  >
                    Mark Fulfilled
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="flex-1 min-w-[140px] rounded-xl h-14 border-2 font-black uppercase text-[10px] tracking-widest"
                  onClick={() => setSelectedOrderForView(null)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-8 bg-white border-none">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black font-headline uppercase tracking-tighter">{editingItem ? 'Update Product' : 'Add New Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase opacity-60 ml-2">Name</Label>
                <Input value={menuFormData.name} onChange={e => setMenuFormData({...menuFormData, name: e.target.value})} className="h-12 rounded-xl bg-secondary/30 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase opacity-60 ml-2">Price (₹)</Label>
                <Input type="number" value={menuFormData.price} onChange={e => setMenuFormData({...menuFormData, price: e.target.value})} className="h-12 rounded-xl bg-secondary/30 border-none font-bold" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase opacity-60 ml-2">Category</Label>
                <select value={menuFormData.category} onChange={e => setMenuFormData({...menuFormData, category: e.target.value})} className="w-full h-12 rounded-xl bg-secondary/30 border-none px-4 text-[10px] font-black uppercase outline-none">
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase opacity-60 ml-2">Image Link</Label>
                <Input value={menuFormData.imageUrl} onChange={e => setMenuFormData({...menuFormData, imageUrl: e.target.value})} className="h-12 rounded-xl bg-secondary/30 border-none font-bold" />
              </div>
            </div>
            <div className="flex items-center justify-between p-6 bg-secondary/30 rounded-2xl">
              <div className="flex items-center gap-4">
                <Switch checked={menuFormData.isAvailable} onCheckedChange={(checked) => setMenuFormData({...menuFormData, isAvailable: checked})} />
                <span className="text-[9px] font-black uppercase tracking-widest">Active Stock</span>
              </div>
              <div className="flex items-center gap-4">
                <Switch checked={menuFormData.isVeg} onCheckedChange={(checked) => setMenuFormData({...menuFormData, isVeg: checked})} />
                <span className="text-[9px] font-black uppercase tracking-widest">Veg Item</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4 mt-8">
            <Button variant="outline" className="flex-1 h-14 rounded-xl font-black uppercase text-[10px]" onClick={() => setIsMenuDialogOpen(false)}>Discard</Button>
            <Button className="flex-1 h-14 rounded-xl font-black uppercase text-[10px] bg-primary" onClick={handleSaveMenuItem} disabled={saveLoading}>
              {saveLoading ? <Loader2 className="animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};
