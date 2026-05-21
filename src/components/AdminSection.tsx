
"use client"
import React, { useState, useMemo } from 'react';
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
  LayoutDashboard, Zap, Star, Trash2, Plus, Edit2, X, Image as ImageIcon
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { CATEGORIES } from '@/app/lib/menu-data';
import { reviewSummaryGenerator } from '@/ai/flows/review-summary-generator';
import { dailySpecialGenerator } from '@/ai/flows/daily-special-generator';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit, doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const MOCK_REVIEWS: Record<string, string[]> = {
  '1': ["Balanced spices!", "A bit too much onion", "Best campus snack", "Fast delivery"],
  '3': ["Authentic style", "Portion size could be better", "Amazing flavors", "Perfect spices"],
  '5': ["Rich chocolate", "Too sweet for me", "Best presentation", "Nuts add great crunch"]
};

export const AdminSection = () => {
  const db = useFirestore();
  
  // Real-time Orders
  const ordersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50));
  }, [db]);
  const { data: realOrders, loading: ordersLoading } = useCollection(ordersQuery);

  // Real-time Menu
  const menuQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'menu'), orderBy('category'));
  }, [db]);
  const { data: dbMenu, loading: menuLoading } = useCollection(menuQuery);

  // AI State
  const [selectedDish, setSelectedDish] = useState('1');
  const [summary, setSummary] = useState('');
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<any>(null);
  const [selectedPromoDish, setSelectedPromoDish] = useState<any>(null);

  // Menu Form State
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
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
    const revenue = deliveredOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
    return {
      revenue,
      count: realOrders.length,
      delivered: deliveredOrders.length
    };
  }, [realOrders]);

  const handleUpdateStatus = (id: string, newStatus: string) => {
    const orderRef = doc(db, 'orders', id);
    updateDoc(orderRef, { status: newStatus })
      .then(() => {
        toast({ title: `Order ${id} updated to ${newStatus}` });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: orderRef.path, operation: 'update' }));
      });
  };

  const handleDeleteOrder = (id: string) => {
    const orderRef = doc(db, 'orders', id);
    deleteDoc(orderRef)
      .then(() => {
        toast({ title: `Order ${id} deleted` });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: orderRef.path, operation: 'delete' }));
      });
  };

  const handleSaveMenuItem = () => {
    const itemId = editingItem ? editingItem.id : `ITEM-${Date.now()}`;
    const itemRef = doc(db, 'menu', itemId);
    const data = {
      ...menuFormData,
      price: Number(menuFormData.price),
      updatedAt: serverTimestamp()
    };

    setDoc(itemRef, data, { merge: true })
      .then(() => {
        toast({ title: editingItem ? "Item Updated" : "Item Added", description: `${data.name} is now live.` });
        setIsMenuDialogOpen(false);
        setEditingItem(null);
        setMenuFormData({
          name: '', description: '', price: 0, category: 'Veg Maggie', image: '', isVeg: true, isAvailable: true, rating: 4.5
        });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: itemRef.path, operation: 'write', requestResourceData: data }));
      });
  };

  const toggleAvailability = (id: string, current: boolean) => {
    const itemRef = doc(db, 'menu', id);
    updateDoc(itemRef, { isAvailable: !current })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: itemRef.path, operation: 'update' }));
      });
  };

  const handleDeleteItem = (id: string) => {
    const itemRef = doc(db, 'menu', id);
    deleteDoc(itemRef)
      .then(() => toast({ title: "Item removed from menu" }))
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: itemRef.path, operation: 'delete' }));
      });
  };

  const handleGenerateSummary = async () => {
    setLoadingFeedback(true);
    try {
      const reviews = MOCK_REVIEWS[selectedDish] || ["Good food", "Nice experience"];
      const result = await reviewSummaryGenerator({ reviews });
      setSummary(result.summary);
    } catch (error) {
      setSummary("AI analysis currently unavailable.");
    } finally {
      setLoadingFeedback(false);
    }
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
      toast({ variant: "destructive", title: "Promo Generation Failed" });
    } finally {
      setPromoLoading(false);
    }
  };

  return (
    <section className="py-8 bg-muted/20 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-headline font-black tracking-tight flex items-center gap-2">
              <LayoutDashboard className="w-8 h-8 text-primary" />
              Easy<span className="text-primary">Bites</span> Command Center
            </h1>
            <p className="text-muted-foreground text-sm font-medium">Real-time operations & dynamic menu control</p>
          </div>
          <div className="flex gap-2">
             <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 px-3 py-1 font-bold">Kitchen: LIVE</Badge>
             <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1 font-bold">Delivery: {stats.count > 0 ? 'BUSY' : 'IDLE'}</Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card p-1 rounded-2xl border w-full md:w-auto shadow-sm">
            <TabsTrigger value="overview" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2">
              Orders {stats.count > 0 && <Badge className="ml-1 bg-white text-primary h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">{stats.count}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="inventory" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Menu & Stock</TabsTrigger>
            <TabsTrigger value="marketing" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Marketing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               {[
                 { label: "Total Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: IndianRupee, color: "text-green-600" },
                 { label: "Total Orders", value: stats.count.toString(), icon: Package, color: "text-blue-600" },
                 { label: "Success Rate", value: stats.count > 0 ? `${Math.round((stats.delivered / stats.count) * 100)}%` : "0%", icon: CheckCircle2, color: "text-orange-600" },
                 { label: "AI Rating", value: "4.8", icon: Star, color: "text-yellow-600" }
               ].map((s, i) => (
                 <Card key={i} className="rounded-3xl border-none shadow-md overflow-hidden bg-card">
                    <CardContent className="p-5">
                       <div className={`w-10 h-10 rounded-2xl bg-muted flex items-center justify-center mb-3 ${s.color}`}>
                          <s.icon className="w-5 h-5" />
                       </div>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</p>
                       <h3 className="text-2xl font-black">{s.value}</h3>
                    </CardContent>
                 </Card>
               ))}
             </div>
          </TabsContent>

          <TabsContent value="orders" className="animate-in fade-in slide-in-from-bottom duration-500">
            <Card className="rounded-3xl shadow-md border-none overflow-hidden">
              {ordersLoading ? (
                <div className="p-20 text-center flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p className="font-bold text-muted-foreground">Fetching real-time orders...</p>
                </div>
              ) : realOrders.length === 0 ? (
                <div className="p-20 text-center flex flex-col items-center gap-4">
                  <Package className="w-16 h-16 text-muted-foreground/20" />
                  <p className="font-bold text-muted-foreground">No orders received yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-bold">Order ID</TableHead>
                      <TableHead className="font-bold">Customer</TableHead>
                      <TableHead className="font-bold">Items</TableHead>
                      <TableHead className="font-bold">Total</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="font-bold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {realOrders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs font-bold">{order.orderId}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{order.customerName}</span>
                            <span className="text-[10px] text-muted-foreground">{order.customerPhone}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {order.items.map((i: any) => `${i.name} (x${i.quantity})`).join(', ')}
                        </TableCell>
                        <TableCell className="font-black text-primary">₹{order.total}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`rounded-lg font-black uppercase text-[10px] ${
                            order.status === 'Delivered' ? 'bg-green-50 text-green-700' :
                            order.status === 'Preparing' ? 'bg-blue-50 text-blue-700' :
                            order.status === 'Pending' ? 'bg-orange-50 text-orange-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => handleUpdateStatus(order.id, 'Preparing')}>
                              <Clock className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-green-600" onClick={() => handleUpdateStatus(order.id, 'Delivered')}>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-destructive" onClick={() => handleDeleteOrder(order.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
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

          <TabsContent value="inventory" className="animate-in fade-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase tracking-widest">Menu Management</h2>
              <Dialog open={isMenuDialogOpen} onOpenChange={(open) => {
                setIsMenuDialogOpen(open);
                if (!open) { setEditingItem(null); setMenuFormData({ name: '', description: '', price: 0, category: 'Veg Maggie', image: '', isVeg: true, isAvailable: true, rating: 4.5 }); }
              }}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl font-bold gap-2">
                    <Plus className="w-4 h-4" /> Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl rounded-[32px]">
                  <DialogHeader>
                    <DialogTitle>{editingItem ? 'Edit Food Item' : 'Add New Food Item'}</DialogTitle>
                  </DialogHeader>
                  <div className="grid md:grid-cols-2 gap-6 py-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Dish Name</Label>
                        <Input value={menuFormData.name} onChange={(e) => setMenuFormData({...menuFormData, name: e.target.value})} placeholder="e.g. Peri Peri Maggie" />
                      </div>
                      <div className="space-y-2">
                        <Label>Price (₹)</Label>
                        <Input type="number" value={menuFormData.price} onChange={(e) => setMenuFormData({...menuFormData, price: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={menuFormData.category}
                          onChange={(e) => setMenuFormData({...menuFormData, category: e.target.value})}
                        >
                          {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-6 pt-2">
                        <div className="flex items-center gap-2">
                          <Switch checked={menuFormData.isVeg} onCheckedChange={(v) => setMenuFormData({...menuFormData, isVeg: v})} />
                          <Label>Veg</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={menuFormData.isAvailable} onCheckedChange={(v) => setMenuFormData({...menuFormData, isAvailable: v})} />
                          <Label>Available</Label>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Image URL</Label>
                        <Input value={menuFormData.image} onChange={(e) => setMenuFormData({...menuFormData, image: e.target.value})} placeholder="https://picsum.photos/..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={menuFormData.description} onChange={(e) => setMenuFormData({...menuFormData, description: e.target.value})} placeholder="Delicious spicy noodles..." />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsMenuDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveMenuItem} disabled={!menuFormData.name || !menuFormData.image}>Save Item</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {menuLoading ? (
              <div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" /></div>
            ) : dbMenu.length === 0 ? (
              <div className="p-20 text-center bg-card rounded-3xl border border-dashed">
                <ImageIcon className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground font-bold">No menu items found in Firestore. Add your first item!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dbMenu.map((item: any) => (
                  <Card key={item.id} className="rounded-3xl border-none shadow-md overflow-hidden group">
                    <CardContent className="p-0">
                      <div className="relative h-32 bg-muted">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-3 left-4 flex justify-between items-end w-[calc(100%-32px)]">
                          <div>
                            <h4 className="text-white font-bold text-sm">{item.name}</h4>
                            <span className="text-white/80 text-[10px] uppercase font-black tracking-widest">{item.category}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="secondary" className="h-7 w-7 rounded-lg" onClick={() => {
                              setEditingItem(item);
                              setMenuFormData({...item});
                              setIsMenuDialogOpen(true);
                            }}>
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="destructive" className="h-7 w-7 rounded-lg" onClick={() => handleDeleteItem(item.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="p-5 flex items-center justify-between">
                         <div className="space-y-1">
                            <p className="text-xs font-bold text-muted-foreground">₹{item.price} • {item.isVeg ? 'Veg' : 'Non-Veg'}</p>
                            <Badge className={item.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                              {item.isAvailable ? "In Stock" : "Sold Out"}
                            </Badge>
                         </div>
                         <Switch checked={item.isAvailable} onCheckedChange={() => toggleAvailability(item.id, item.isAvailable)} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="marketing" className="space-y-6 animate-in fade-in duration-500">
             <div className="grid lg:grid-cols-3 gap-6">
                <Card className="rounded-3xl border-none shadow-md">
                   <CardHeader>
                     <CardTitle className="text-lg">Promotional AI</CardTitle>
                     <CardDescription>Generate daily specials and social copy.</CardDescription>
                   </CardHeader>
                   <CardContent className="space-y-4">
                      <div className="space-y-2">
                         <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select Dish</Label>
                         <div className="grid grid-cols-2 gap-2">
                           {(dbMenu.length > 0 ? dbMenu : []).slice(0, 4).map((item: any) => (
                             <button
                               key={item.id}
                               onClick={() => setSelectedPromoDish(item)}
                               className={`p-3 rounded-xl border-2 text-left transition-all ${
                                 selectedPromoDish?.id === item.id ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50'
                               }`}
                             >
                               <span className="text-[10px] block font-black truncate">{item.name}</span>
                             </button>
                           ))}
                         </div>
                      </div>
                      <Button 
                        className="w-full h-12 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20"
                        onClick={handleGeneratePromo}
                        disabled={promoLoading || !selectedPromoDish}
                      >
                        {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                        Generate Special
                      </Button>
                   </CardContent>
                </Card>

                <Card className="lg:col-span-2 rounded-3xl border-none shadow-md bg-muted/30 relative flex items-center justify-center p-8 overflow-hidden">
                   {promoResult ? (
                     <div className="max-w-md w-full space-y-6 animate-in zoom-in duration-500">
                        <div className="p-6 bg-card rounded-[32px] shadow-2xl border border-primary/10 relative">
                           <div className="absolute -top-3 -right-3 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white text-2xl animate-bounce">
                             {promoResult.emoji}
                           </div>
                           <h4 className="text-2xl font-black mb-2 text-primary">{promoResult.promoTitle}</h4>
                           <p className="text-sm text-muted-foreground leading-relaxed mb-6 italic">{promoResult.promoDescription}</p>
                           <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl">
                              <div>
                                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Special Price</p>
                                 <p className="text-2xl font-black">₹{promoResult.finalPrice}</p>
                              </div>
                              <Button variant="outline" className="rounded-xl border-primary text-primary font-bold text-xs h-9" onClick={() => {
                                navigator.clipboard.writeText(`${promoResult.promoTitle}\n${promoResult.promoDescription}\nOnly for ₹${promoResult.finalPrice}!`);
                                toast({ title: "Copied to clipboard" });
                              }}>
                                 Copy to Post
                              </Button>
                           </div>
                        </div>
                     </div>
                   ) : (
                     <div className="text-center space-y-3 opacity-30">
                        <Sparkles className="w-12 h-12 mx-auto" />
                        <p className="font-bold">Select a dish to generate a promotion</p>
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
