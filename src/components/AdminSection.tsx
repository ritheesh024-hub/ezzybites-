
"use client"
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  BarChart3, IndianRupee, MessageSquare, Sparkles, Loader2, 
  Package, Clock, CheckCircle2, ShoppingCart,
  ArrowUpRight, Megaphone,
  LayoutDashboard, Zap, Star, Trash2, Plus, Edit2, X, Image as ImageIcon, Upload
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { CATEGORIES } from '@/app/lib/menu-data';
import { dailySpecialGenerator } from '@/ai/flows/daily-special-generator';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit, doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const AdminSection = () => {
  const db = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Real-time Orders Listener
  const ordersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50));
  }, [db]);
  const { data: realOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);

  // Real-time Menu Listener
  const menuQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'menu'), orderBy('updatedAt', 'desc'));
  }, [db]);
  const { data: dbMenu, loading: menuLoading } = useCollection<any>(menuQuery);

  // AI State
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<any>(null);
  const [selectedPromoDish, setSelectedPromoDish] = useState<any>(null);

  // Menu Form State
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [menuFormData, setMenuFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'Veg Maggie',
    image: '',
    isVeg: true,
    isAvailable: true,
    rating: 4.5
  });

  // Dynamic Stats
  const stats = useMemo(() => {
    if (!realOrders) return { revenue: 0, count: 0, delivered: 0 };
    const deliveredOrders = realOrders.filter(o => o.status === 'Delivered');
    const revenue = deliveredOrders.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    return {
      revenue,
      count: realOrders.length,
      delivered: deliveredOrders.length
    };
  }, [realOrders]);

  const handleUpdateStatus = (id: string, newStatus: string) => {
    if (!db) return;
    const orderRef = doc(db, 'orders', id);
    updateDoc(orderRef, { status: newStatus })
      .then(() => {
        toast({ title: `Order updated to ${newStatus}` });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: orderRef.path, operation: 'update' }));
      });
  };

  const handleDeleteOrder = (id: string) => {
    if (!db) return;
    const orderRef = doc(db, 'orders', id);
    deleteDoc(orderRef)
      .then(() => {
        toast({ title: `Order deleted` });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: orderRef.path, operation: 'delete' }));
      });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) { 
        toast({ 
          variant: "destructive", 
          title: "File too large", 
          description: "Please select an image smaller than 800KB." 
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setMenuFormData(prev => ({ ...prev, image: event.target?.result as string }));
          toast({ title: "Image Loaded", description: "Ready to publish." });
        }
      };
      reader.onerror = () => {
        toast({ variant: "destructive", title: "Error reading file" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveMenuItem = () => {
    if (!db) {
      toast({ variant: "destructive", title: "Database connection lost" });
      return;
    }

    if (!menuFormData.name || !menuFormData.image) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please provide a name and a photo for the dish." });
      return;
    }

    setSaveLoading(true);
    // CRITICAL: Preserve the ID if editing, otherwise create a new one
    const itemId = editingItem ? editingItem.id : `ITEM-${Date.now()}`;
    const itemRef = doc(db, 'menu', itemId);
    
    const finalData = {
      id: itemId,
      name: menuFormData.name.trim(),
      description: (menuFormData.description || '').trim(),
      price: Number(menuFormData.price) || 0,
      category: menuFormData.category,
      image: menuFormData.image,
      isVeg: Boolean(menuFormData.isVeg),
      isAvailable: Boolean(menuFormData.isAvailable),
      rating: Number(menuFormData.rating) || 4.5,
      updatedAt: serverTimestamp()
    };

    setDoc(itemRef, finalData, { merge: true })
      .then(() => {
        toast({ 
          title: editingItem ? "Changes Applied" : "Dish Published! 🚀", 
          description: `${finalData.name} is ${editingItem ? 'updated' : 'now visible to customers'}.` 
        });
        setIsMenuDialogOpen(false);
        resetForm();
      })
      .catch(async (error) => {
        console.error("Save Error:", error);
        const permissionError = new FirestorePermissionError({ 
          path: itemRef.path, 
          operation: 'write', 
          requestResourceData: finalData 
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setSaveLoading(false);
      });
  };

  const resetForm = () => {
    setEditingItem(null);
    setMenuFormData({
      name: '', description: '', price: 0, category: 'Veg Maggie', image: '', isVeg: true, isAvailable: true, rating: 4.5
    });
  };

  const handleEditClick = (item: any) => {
    setEditingItem(item);
    setMenuFormData({
      name: item.name || '',
      description: item.description || '',
      price: item.price || 0,
      category: item.category || 'Veg Maggie',
      image: item.image || '',
      isVeg: item.isVeg !== undefined ? item.isVeg : true,
      isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
      rating: item.rating || 4.5
    });
    setIsMenuDialogOpen(true);
  };

  const toggleAvailability = (id: string, current: boolean) => {
    if (!db) return;
    const itemRef = doc(db, 'menu', id);
    updateDoc(itemRef, { 
      isAvailable: !current,
      updatedAt: serverTimestamp()
    })
    .catch(async (error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: itemRef.path, operation: 'update' }));
    });
  };

  const handleDeleteItem = (id: string) => {
    if (!db) return;
    if (!confirm("Are you sure you want to remove this item from the menu?")) return;
    
    const itemRef = doc(db, 'menu', id);
    deleteDoc(itemRef)
      .then(() => toast({ title: "Removed from menu" }))
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: itemRef.path, operation: 'delete' }));
      });
  };

  const handleGeneratePromo = async () => {
    if (!selectedPromoDish) return;
    setPromoLoading(true);
    try {
      const result = await dailySpecialGenerator({
        dishName: selectedPromoDish.name,
        basePrice: selectedPromoDish.price,
        discountPercent: 15
      });
      setPromoResult(result);
    } catch (error) {
      toast({ variant: "destructive", title: "AI Generation Failed" });
    } finally {
      setPromoLoading(false);
    }
  };

  return (
    <section className="py-8 bg-muted/20 min-h-screen">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 animate-in fade-in slide-in-from-top duration-700">
          <div>
            <h1 className="text-4xl font-headline font-black tracking-tight flex items-center gap-3">
              <div className="p-2.5 bg-primary rounded-2xl shadow-xl shadow-primary/20 transform -rotate-2">
                 <LayoutDashboard className="w-7 h-7 text-white" />
              </div>
              Easy<span className="text-primary">Bites</span> Command Center
            </h1>
            <p className="text-muted-foreground text-sm font-medium ml-14">Live business metrics and real-time operations</p>
          </div>
          <div className="flex gap-3">
             <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 px-5 py-2 font-black uppercase tracking-widest text-[10px] rounded-full shadow-sm">Kitchen: LIVE</Badge>
             <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 px-5 py-2 font-black uppercase tracking-widest text-[10px] rounded-full shadow-sm">Active Orders: {realOrders.filter(o => o.status !== 'Delivered').length}</Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-card p-1.5 rounded-[24px] border w-full md:w-auto shadow-sm flex overflow-x-auto">
            <TabsTrigger value="overview" className="rounded-xl flex-1 md:flex-none px-8 py-3 font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Overview</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-xl flex-1 md:flex-none px-8 py-3 font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center gap-2">
              Orders {stats.count > 0 && <Badge className="ml-1 bg-white text-primary h-5 min-w-5 p-0 flex items-center justify-center rounded-full text-[10px]">{stats.count}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="inventory" className="rounded-xl flex-1 md:flex-none px-8 py-3 font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Menu & Stock</TabsTrigger>
            <TabsTrigger value="marketing" className="rounded-xl flex-1 md:flex-none px-8 py-3 font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Marketing
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab Content */}
          <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
               {[
                 { label: "Daily Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: IndianRupee, color: "text-green-600", bg: "bg-green-50" },
                 { label: "Active Orders", value: stats.count.toString(), icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
                 { label: "Kitchen Efficiency", value: stats.count > 0 ? `${Math.round((stats.delivered / stats.count) * 100)}%` : "0%", icon: CheckCircle2, color: "text-orange-600", bg: "bg-orange-50" },
                 { label: "AI Rating Avg", value: "4.8", icon: Star, color: "text-yellow-600", bg: "bg-yellow-50" }
               ].map((s, i) => (
                 <Card key={i} className="rounded-[32px] border-none shadow-xl overflow-hidden bg-card hover:translate-y-[-4px] transition-all duration-300">
                    <CardContent className="p-8">
                       <div className={`w-14 h-14 rounded-2xl ${s.bg} flex items-center justify-center mb-5 ${s.color}`}>
                          <s.icon className="w-7 h-7" />
                       </div>
                       <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{s.label}</p>
                       <h3 className="text-4xl font-black">{s.value}</h3>
                    </CardContent>
                 </Card>
               ))}
             </div>
          </TabsContent>

          {/* Orders Tab Content */}
          <TabsContent value="orders" className="animate-in fade-in slide-in-from-bottom-5 duration-500">
            <Card className="rounded-[40px] shadow-2xl border-none overflow-hidden">
              {ordersLoading ? (
                <div className="p-32 text-center flex flex-col items-center gap-6">
                  <Loader2 className="w-16 h-16 animate-spin text-primary" />
                  <p className="font-black text-muted-foreground uppercase tracking-widest text-xs">Syncing real-time orders...</p>
                </div>
              ) : realOrders.length === 0 ? (
                <div className="p-32 text-center flex flex-col items-center gap-6">
                  <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-muted-foreground opacity-20" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">No orders yet today</h3>
                    <p className="text-muted-foreground text-sm font-medium mt-2">New orders will pop up here instantly.</p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-none">
                      <TableHead className="font-black uppercase tracking-widest text-[10px] py-7 px-10">Order ID</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] py-7">Customer</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] py-7">Items</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] py-7">Total</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] py-7">Status</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] py-7 text-right px-10">Manage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {realOrders.map((order: any) => (
                      <TableRow key={order.id} className="group hover:bg-muted/20 border-muted/50 transition-all duration-300">
                        <TableCell className="font-mono text-xs font-bold px-10">{order.orderId}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{order.customerName}</span>
                            <span className="text-[10px] text-muted-foreground font-black tracking-widest mt-0.5">{order.customerPhone}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[250px] truncate">
                          {order.items?.map((i: any) => `${i.name} (x${i.quantity})`).join(', ') || 'N/A'}
                        </TableCell>
                        <TableCell className="font-black text-primary text-base">₹{order.total}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`rounded-xl font-black uppercase text-[9px] px-3 py-1.5 ${
                            order.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-100' :
                            order.status === 'Preparing' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            order.status === 'Pending' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-red-50 text-red-700 border-red-100'
                          }`}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-10">
                          <div className="flex justify-end gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Button size="icon" variant="outline" className="h-10 w-10 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm" onClick={() => handleUpdateStatus(order.id, 'Preparing')}>
                              <Clock className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="outline" className="h-10 w-10 rounded-xl hover:bg-green-600 hover:text-white transition-all text-green-600 shadow-sm" onClick={() => handleUpdateStatus(order.id, 'Delivered')}>
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => handleDeleteOrder(order.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          {/* Inventory Tab Content */}
          <TabsContent value="inventory" className="animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-widest">Menu Catalog</h2>
                <p className="text-muted-foreground text-sm font-medium mt-1">Control your storefront offerings in real-time</p>
              </div>
              <Dialog open={isMenuDialogOpen} onOpenChange={(open) => {
                setIsMenuDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="rounded-2xl h-14 px-10 font-black uppercase tracking-widest gap-3 shadow-2xl shadow-primary/30 hover:scale-105 transition-all active:scale-95" onClick={resetForm}>
                    <Plus className="w-6 h-6" /> Add New Dish
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl rounded-[40px] max-h-[90vh] overflow-y-auto border-none shadow-3xl p-0 overflow-hidden">
                  <div className="bg-primary p-10 text-white relative">
                    <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                    <DialogHeader>
                      <DialogTitle className="text-4xl font-black tracking-tight">{editingItem ? 'Update Dish' : 'Publish Dish'}</DialogTitle>
                      <p className="text-white/80 font-medium mt-2">Craft the perfect presentation for your customers.</p>
                    </DialogHeader>
                  </div>
                  <div className="p-10 space-y-10">
                    <div className="grid md:grid-cols-2 gap-10">
                      <div className="space-y-7">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground ml-1">Dish Name</Label>
                          <Input value={menuFormData.name} onChange={(e) => setMenuFormData({...menuFormData, name: e.target.value})} placeholder="e.g. Schezwan Egg Maggie" className="rounded-2xl h-14 border-muted bg-muted/20 focus:ring-primary/20 text-base font-bold" />
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                           <div className="space-y-3">
                             <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground ml-1">Price (₹)</Label>
                             <Input type="number" value={menuFormData.price} onChange={(e) => setMenuFormData({...menuFormData, price: Number(e.target.value)})} className="rounded-2xl h-14 border-muted bg-muted/20 font-bold" />
                           </div>
                           <div className="space-y-3">
                             <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground ml-1">Type</Label>
                             <div className="h-14 flex items-center justify-between px-4 bg-muted/20 rounded-2xl border border-muted">
                               <span className="text-xs font-black uppercase tracking-widest">{menuFormData.isVeg ? 'Veg' : 'Non-Veg'}</span>
                               <Switch checked={menuFormData.isVeg} onCheckedChange={(v) => setMenuFormData({...menuFormData, isVeg: v})} />
                             </div>
                           </div>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground ml-1">Category</Label>
                          <select 
                            className="flex h-14 w-full rounded-2xl border border-muted bg-muted/20 px-5 py-2 text-sm font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={menuFormData.category}
                            onChange={(e) => setMenuFormData({...menuFormData, category: e.target.value})}
                          >
                            {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-7">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground ml-1">Food Photography</Label>
                          <div className="flex flex-col gap-4">
                            {menuFormData.image ? (
                              <div className="relative w-full h-48 rounded-[32px] overflow-hidden border-4 border-white shadow-2xl bg-muted group/img">
                                <img src={menuFormData.image} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                  <Button 
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setMenuFormData({...menuFormData, image: ''})}
                                    className="rounded-full h-12 w-12 p-0 shadow-2xl"
                                  >
                                    <X className="w-6 h-6" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div 
                                className="border-4 border-dashed border-muted-foreground/20 rounded-[32px] p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-muted/30 hover:border-primary/30 transition-all duration-500 group"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <div className="w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                  <Upload className="w-7 h-7 text-primary" />
                                </div>
                                <div className="text-center">
                                  <p className="text-xs font-black uppercase tracking-[0.2em]">Select Photo</p>
                                  <p className="text-[9px] text-muted-foreground font-bold mt-2">Up to 800KB</p>
                                </div>
                              </div>
                            )}
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground ml-1">Menu Description</Label>
                          <Textarea value={menuFormData.description} onChange={(e) => setMenuFormData({...menuFormData, description: e.target.value})} placeholder="Describe the flavors and ingredients..." className="min-h-[120px] rounded-2xl border-muted bg-muted/20 p-5 font-medium leading-relaxed" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/30 p-10 flex justify-end gap-5 border-t">
                    <Button variant="ghost" onClick={() => setIsMenuDialogOpen(false)} className="rounded-2xl font-black uppercase tracking-widest text-xs px-10 h-14">Discard</Button>
                    <Button onClick={handleSaveMenuItem} disabled={!menuFormData.name || !menuFormData.image || saveLoading} className="rounded-2xl h-14 px-12 font-black uppercase tracking-widest shadow-2xl shadow-primary/30 min-w-[200px]">
                      {saveLoading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <CheckCircle2 className="w-5 h-5 mr-3" />}
                      {editingItem ? 'Apply Changes' : 'Confirm Publish'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {menuLoading ? (
              <div className="p-32 text-center flex flex-col items-center gap-6">
                <Loader2 className="w-16 h-16 animate-spin text-primary" />
                <p className="font-black text-muted-foreground uppercase tracking-widest text-xs">Loading menu catalog...</p>
              </div>
            ) : dbMenu.length === 0 ? (
              <div className="p-32 text-center bg-card rounded-[48px] border-4 border-dashed border-muted/50">
                <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <ImageIcon className="w-12 h-12 text-muted-foreground opacity-20" />
                </div>
                <h3 className="text-3xl font-black mb-3">Your menu is empty</h3>
                <p className="text-muted-foreground font-medium mb-12 max-w-md mx-auto leading-relaxed">Ready to serve your first customer? Add your signature dishes to get the orders flowing.</p>
                <Button variant="default" size="lg" className="rounded-full px-12 h-16 font-black uppercase tracking-widest shadow-2xl shadow-primary/30" onClick={() => setIsMenuDialogOpen(true)}>
                  Start Publishing
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {dbMenu.map((item: any, idx: number) => (
                  <Card key={item.id} className="rounded-[40px] border-none shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500 animate-in zoom-in duration-700" style={{ animationDelay: `${idx * 75}ms` }}>
                    <CardContent className="p-0">
                      <div className="relative h-56 bg-muted overflow-hidden">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                        <div className="absolute top-5 left-5">
                           {item.isVeg ? (
                             <div className="w-7 h-7 bg-white rounded-lg border-2 border-green-500 flex items-center justify-center shadow-lg">
                               <div className="w-3 h-3 rounded-full bg-green-500" />
                             </div>
                           ) : (
                             <div className="w-7 h-7 bg-white rounded-lg border-2 border-red-500 flex items-center justify-center shadow-lg">
                               <div className="w-3 h-3 rounded-full bg-red-500" />
                             </div>
                           )}
                        </div>
                        <div className="absolute bottom-5 left-6 right-6 flex justify-between items-end">
                          <div className="max-w-[180px]">
                            <h4 className="text-white font-black text-xl truncate mb-1 shadow-sm">{item.name}</h4>
                            <span className="text-white/70 text-[10px] uppercase font-black tracking-[0.3em]">{item.category}</span>
                          </div>
                          <div className="flex gap-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                            <Button size="icon" variant="secondary" className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md hover:bg-white border-none text-white hover:text-primary shadow-2xl" onClick={() => handleEditClick(item)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="destructive" className="h-10 w-10 rounded-xl shadow-2xl" onClick={() => handleDeleteItem(item.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="p-8 flex items-center justify-between bg-card">
                         <div className="space-y-2">
                            <p className="text-2xl font-black text-primary">₹{item.price}</p>
                            <Badge variant={item.isAvailable ? "outline" : "destructive"} className={`text-[9px] h-6 rounded-lg px-3 font-black uppercase tracking-widest ${item.isAvailable ? 'bg-green-50 text-green-700 border-green-200 shadow-sm' : 'shadow-sm'}`}>
                              {item.isAvailable ? "Available" : "Sold Out"}
                            </Badge>
                         </div>
                         <div className="flex flex-col items-center gap-2">
                           <Switch checked={item.isAvailable} onCheckedChange={() => toggleAvailability(item.id, item.isAvailable)} className="scale-100" />
                           <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Status</span>
                         </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Marketing Tab Content */}
          <TabsContent value="marketing" className="space-y-8 animate-in fade-in duration-500">
             <div className="grid lg:grid-cols-3 gap-10">
                <Card className="rounded-[48px] border-none shadow-2xl bg-card">
                   <CardHeader className="p-10 pb-5">
                     <CardTitle className="text-2xl font-black uppercase tracking-widest">Promotion AI</CardTitle>
                     <p className="text-muted-foreground font-medium mt-1">Generate viral-ready social media content.</p>
                   </CardHeader>
                   <CardContent className="px-10 pb-10 space-y-8">
                      <div className="space-y-4">
                         <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground ml-1">Featured Product</Label>
                         <div className="grid grid-cols-2 gap-4">
                           {(dbMenu.length > 0 ? dbMenu : []).slice(0, 4).map((item: any) => (
                             <button
                               key={item.id}
                               onClick={() => setSelectedPromoDish(item)}
                               className={`p-5 rounded-[24px] border-2 text-left transition-all duration-300 relative overflow-hidden group ${
                                 selectedPromoDish?.id === item.id ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/40 hover:bg-muted'
                               }`}
                             >
                               <span className={`text-[11px] block font-black truncate mb-1 ${selectedPromoDish?.id === item.id ? 'text-primary' : 'text-foreground'}`}>{item.name}</span>
                               <span className="text-[9px] font-bold opacity-50 tracking-widest">₹{item.price}</span>
                               {selectedPromoDish?.id === item.id && (
                                 <div className="absolute -right-1 -bottom-1 w-6 h-6 bg-primary rounded-tl-xl flex items-center justify-center">
                                   <CheckCircle2 className="w-3 h-3 text-white" />
                                 </div>
                               )}
                             </button>
                           ))}
                         </div>
                      </div>
                      <Button 
                        className="w-full h-16 rounded-2xl font-black uppercase tracking-widest gap-3 shadow-2xl shadow-primary/30"
                        onClick={handleGeneratePromo}
                        disabled={promoLoading || !selectedPromoDish}
                      >
                        {promoLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Megaphone className="w-6 h-6" />}
                        Generate Campaign
                      </Button>
                   </CardContent>
                </Card>

                <Card className="lg:col-span-2 rounded-[48px] border-none shadow-2xl bg-muted/20 relative flex items-center justify-center p-12 overflow-hidden min-h-[500px]">
                   {promoResult ? (
                     <div className="max-w-lg w-full space-y-10 animate-in zoom-in-95 duration-700">
                        <div className="p-12 bg-card rounded-[56px] shadow-3xl border border-primary/10 relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                           <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary rounded-[32px] flex items-center justify-center text-white text-5xl shadow-2xl shadow-primary/40 animate-bounce duration-[3000ms]">
                             {promoResult.emoji}
                           </div>
                           <Badge className="bg-primary/10 text-primary border-primary/20 mb-8 font-black uppercase tracking-[0.4em] text-[10px] px-6 py-2.5 rounded-full">AI Campaign Engine</Badge>
                           <h4 className="text-4xl font-black mb-6 text-foreground leading-tight">{promoResult.promoTitle}</h4>
                           <p className="text-lg text-muted-foreground leading-relaxed mb-12 font-medium italic opacity-90">"{promoResult.promoDescription}"</p>
                           <div className="flex items-center justify-between p-8 bg-primary/5 rounded-[40px] border border-primary/10 backdrop-blur-sm">
                              <div>
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2">Exclusive Offer</p>
                                 <p className="text-4xl font-black text-primary">₹{promoResult.finalPrice}</p>
                              </div>
                              <Button className="rounded-2xl h-14 px-10 font-black uppercase tracking-widest text-[11px] gap-3 shadow-lg" onClick={() => {
                                navigator.clipboard.writeText(`${promoResult.promoTitle}\n${promoResult.promoDescription}\n🔥 Only for ₹${promoResult.finalPrice}!`);
                                toast({ title: "Campaign Assets Copied!" });
                              }}>
                                 Copy Assets
                              </Button>
                           </div>
                        </div>
                     </div>
                   ) : (
                     <div className="text-center space-y-6 opacity-40">
                        <Sparkles className="w-20 h-20 mx-auto text-primary animate-pulse" />
                        <div>
                          <p className="text-2xl font-black uppercase tracking-[0.3em] mb-2">Campaign Ready</p>
                          <p className="text-sm font-bold tracking-widest">Select a product to generate marketing copy.</p>
                        </div>
                     </div>
                   )}
                </Card>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};
