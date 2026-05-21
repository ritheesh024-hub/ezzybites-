
"use client"
import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  IndianRupee, Sparkles, Loader2, 
  Package, Clock, CheckCircle2,
  Megaphone, LayoutDashboard, Trash2, Plus, Edit2, Upload, RefreshCw
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const firstInputRef = useRef<HTMLInputElement>(null);
  
  const ordersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50));
  }, [db]);
  const { data: realOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);

  const menuQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'menu'), orderBy('name'));
  }, [db]);
  const { data: dbMenu, loading: menuLoading } = useCollection<any>(menuQuery);

  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<any>(null);
  const [selectedPromoDish, setSelectedPromoDish] = useState<any>(null);

  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [menuFormData, setMenuFormData] = useState({
    name: '', description: '', price: '', category: 'Veg Maggie', image: '', isVeg: true, isAvailable: true, rating: '4.5'
  });

  const stats = useMemo(() => {
    if (!realOrders) return { revenue: 0, count: 0, delivered: 0 };
    const delivered = realOrders.filter(o => o.status === 'Delivered');
    const revenue = delivered.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    return { revenue, count: realOrders.length, delivered: delivered.length };
  }, [realOrders]);

  const handleUpdateStatus = (id: string, newStatus: string) => {
    if (!db) return;
    const orderRef = doc(db, 'orders', id);
    updateDoc(orderRef, { status: newStatus }).catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ 
        path: orderRef.path, operation: 'update', requestResourceData: { status: newStatus }
      }));
    });
  };

  const handleDeleteOrder = (id: string) => {
    if (!db || !window.confirm("Delete order?")) return;
    deleteDoc(doc(db, 'orders', id)).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `orders/${id}`, operation: 'delete' }));
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) { 
        toast({ variant: "destructive", title: "Image Too Large", description: "Please use an image under 500KB." });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setMenuFormData(prev => ({ ...prev, image: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setMenuFormData({ name: '', description: '', price: '', category: 'Veg Maggie', image: '', isVeg: true, isAvailable: true, rating: '4.5' });
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => firstInputRef.current?.focus(), 150);
  };

  const handleSaveMenuItem = async () => {
    if (!db || !menuFormData.name || !menuFormData.image) {
      toast({ variant: "destructive", title: "Missing Data", description: "Name and Image are mandatory." });
      return;
    }
    
    setSaveLoading(true);
    const itemId = editingItem ? editingItem.id : `ITEM-${Date.now()}`;
    const itemRef = doc(db, 'menu', itemId);
    
    const finalData = {
      id: itemId,
      name: menuFormData.name.trim(),
      description: menuFormData.description.trim(),
      price: Number(menuFormData.price) || 0,
      category: menuFormData.category,
      image: menuFormData.image,
      isVeg: menuFormData.isVeg,
      isAvailable: menuFormData.isAvailable,
      rating: Number(menuFormData.rating) || 4.5,
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(itemRef, finalData, { merge: true });
      toast({ title: editingItem ? "Item Updated" : "Dish Added! 🚀" });
      if (editingItem) setIsMenuDialogOpen(false);
      resetForm();
    } catch (e) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ 
        path: itemRef.path, operation: 'write', requestResourceData: finalData 
      }));
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <section className="py-10 bg-secondary/5 min-h-screen">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary rounded-2xl shadow-xl text-white"><LayoutDashboard /></div>
            <h1 className="text-4xl font-black font-headline tracking-tight">Ezzy<span className="text-primary">Console</span></h1>
          </div>
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 px-4 py-1.5 uppercase font-black text-[10px] animate-pulse">Live Connected</Badge>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-card p-1.5 rounded-2xl border w-full flex shadow-sm">
            <TabsTrigger value="overview" className="flex-1 py-3 font-black uppercase tracking-widest text-[10px]">Stats</TabsTrigger>
            <TabsTrigger value="orders" className="flex-1 py-3 font-black uppercase tracking-widest text-[10px]">Orders</TabsTrigger>
            <TabsTrigger value="inventory" className="flex-1 py-3 font-black uppercase tracking-widest text-[10px]">Inventory</TabsTrigger>
            <TabsTrigger value="marketing" className="flex-1 py-3 font-black uppercase tracking-widest text-[10px] gap-2 flex items-center justify-center">
              <Sparkles className="w-4 h-4" /> AI Marketing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
               {[
                 { label: "Revenue", value: `₹${stats.revenue}`, icon: IndianRupee, color: "text-green-600", bg: "bg-green-50" },
                 { label: "Orders", value: stats.count, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
                 { label: "Completed", value: stats.delivered, icon: CheckCircle2, color: "text-orange-600", bg: "bg-orange-50" },
                 { label: "Rating", value: "4.8", icon: Sparkles, color: "text-yellow-600", bg: "bg-yellow-50" }
               ].map((s, i) => (
                 <Card key={i} className="rounded-3xl border-none shadow-lg">
                    <CardContent className="p-6">
                       <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center mb-4 ${s.color}`}><s.icon /></div>
                       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{s.label}</p>
                       <h3 className="text-2xl font-black">{s.value}</h3>
                    </CardContent>
                 </Card>
               ))}
             </div>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="rounded-3xl shadow-xl border-none overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="px-6 font-black uppercase text-[10px]">Order Details</TableHead>
                    <TableHead className="px-6 font-black uppercase text-[10px]">Status</TableHead>
                    <TableHead className="px-6 font-black uppercase text-[10px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersLoading ? (
                    <TableRow><TableCell colSpan={3} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
                  ) : realOrders?.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="px-6 font-bold">{order.customerName}<br/><span className="text-[10px] opacity-50">₹{order.total} • {order.paymentMethod}</span></TableCell>
                      <TableCell className="px-6"><Badge variant="secondary">{order.status}</Badge></TableCell>
                      <TableCell className="px-6 text-right space-x-2">
                        <Button size="icon" variant="outline" onClick={() => handleUpdateStatus(order.id, 'Preparing')}><Clock className="w-4 h-4"/></Button>
                        <Button size="icon" variant="outline" onClick={() => handleUpdateStatus(order.id, 'Delivered')}><CheckCircle2 className="w-4 h-4"/></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteOrder(order.id)} className="text-destructive"><Trash2 className="w-4 h-4"/></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-8">
            <Button onClick={() => { resetForm(); setIsMenuDialogOpen(true); }} className="rounded-2xl h-14 px-10 font-black uppercase tracking-widest text-[11px] gap-2 shadow-xl">
              <Plus /> Add New Dish
            </Button>

            <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
              <DialogContent className="max-w-2xl p-0 rounded-[32px] overflow-hidden border-none shadow-3xl">
                <div className="bg-primary p-8 text-white"><DialogTitle className="text-2xl font-black font-headline uppercase">{editingItem ? 'Edit Dish' : 'Publish New Dish'}</DialogTitle></div>
                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Dish Name</Label>
                    <Input ref={firstInputRef} value={menuFormData.name} onChange={e => setMenuFormData({...menuFormData, name: e.target.value})} placeholder="e.g. Schezwan Maggie" className="h-12 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Price (₹)</Label>
                      <Input type="number" value={menuFormData.price} onChange={e => setMenuFormData({...menuFormData, price: e.target.value})} className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Category</Label>
                      <select value={menuFormData.category} onChange={e => setMenuFormData({...menuFormData, category: e.target.value})} className="w-full h-12 rounded-xl border bg-secondary/20 px-4 text-sm font-bold uppercase">
                        {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Dish Photo</Label>
                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer hover:bg-muted/50 transition-all">
                      {menuFormData.image ? (
                        <div className="relative group">
                          <img src={menuFormData.image} className="h-48 w-full object-cover rounded-2xl shadow-xl" alt="Preview" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all rounded-2xl"><RefreshCw className="text-white w-10 h-10" /></div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 opacity-50"><Upload className="w-10 h-10" /><p className="text-[10px] font-black uppercase tracking-widest">Upload Photo (Max 500KB)</p></div>
                      )}
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Description</Label>
                    <Textarea value={menuFormData.description} onChange={e => setMenuFormData({...menuFormData, description: e.target.value})} placeholder="Taste description..." className="rounded-xl min-h-[100px]" />
                  </div>
                </div>
                <div className="p-8 bg-secondary/10 flex gap-4">
                  <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase" onClick={() => setIsMenuDialogOpen(false)} disabled={saveLoading}>Close</Button>
                  <Button className="flex-1 h-14 rounded-2xl font-black uppercase shadow-lg shadow-primary/20" onClick={handleSaveMenuItem} disabled={saveLoading}>
                    {saveLoading ? <Loader2 className="animate-spin" /> : editingItem ? 'Update' : 'Publish'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {menuLoading ? (
                <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>
              ) : dbMenu?.map((item: any) => (
                <Card key={item.id} className="rounded-[32px] border-none shadow-xl overflow-hidden group hover:shadow-2xl transition-all">
                  <div className="h-48 relative">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <Badge className="absolute top-4 left-4 bg-white/90 backdrop-blur text-[9px] uppercase font-black">{item.category}</Badge>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1 min-w-0 mr-4">
                        <h4 className="font-black text-lg truncate">{item.name}</h4>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{item.isVeg ? 'Veg' : 'Non-Veg'}</p>
                      </div>
                      <p className="text-xl font-black text-primary">₹{item.price}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 rounded-xl h-12 font-black text-[10px] uppercase gap-2" onClick={() => { setEditingItem(item); setMenuFormData({ ...item, price: item.price.toString() }); setIsMenuDialogOpen(true); }}>
                        <Edit2 className="w-4 h-4" /> Edit
                      </Button>
                      <Button variant="ghost" className="rounded-xl h-12 px-4 text-destructive hover:bg-destructive/10" onClick={() => { if(confirm("Remove dish?")) deleteDoc(doc(db, 'menu', item.id)); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="marketing">
             <Card className="rounded-[40px] border-none shadow-xl bg-card p-12">
                <div className="max-w-2xl">
                  <h3 className="text-4xl font-black uppercase tracking-tight mb-4">AI Promotion <Sparkles className="inline text-primary" /></h3>
                  <p className="text-muted-foreground mb-10 text-lg">Select a dish to generate a viral social media promotion instantly.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                    {dbMenu?.slice(0, 8).map((item: any) => (
                      <button key={item.id} onClick={() => setSelectedPromoDish(item)} className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase transition-all ${selectedPromoDish?.id === item.id ? 'border-primary bg-primary/5 scale-105' : 'border-muted hover:border-primary/20'}`}>{item.name}</button>
                    ))}
                  </div>
                  <Button size="lg" className="rounded-2xl h-16 px-10 font-black uppercase tracking-widest gap-3 shadow-xl shadow-primary/20" onClick={async () => {
                    setPromoLoading(true);
                    try {
                      const res = await dailySpecialGenerator({ dishName: selectedPromoDish.name, basePrice: selectedPromoDish.price, discountPercent: 20 });
                      setPromoResult(res);
                    } catch { toast({ variant: "destructive", title: "AI Error" }); }
                    finally { setPromoLoading(false); }
                  }} disabled={promoLoading || !selectedPromoDish}>
                    {promoLoading ? <Loader2 className="animate-spin" /> : <Megaphone />} Create Viral Post
                  </Button>
                  {promoResult && (
                    <div className="mt-12 p-8 bg-primary/5 rounded-[32px] border-2 border-primary/10 space-y-6 animate-in zoom-in">
                      <h4 className="text-3xl font-black">{promoResult.promoTitle} {promoResult.emoji}</h4>
                      <p className="text-lg italic opacity-80 leading-relaxed">"{promoResult.promoDescription}"</p>
                      <Button className="w-full h-14 rounded-2xl font-black uppercase gap-2" onClick={() => { navigator.clipboard.writeText(`${promoResult.promoTitle}\n\n${promoResult.promoDescription}\n\nPrice: ₹${promoResult.finalPrice}`); toast({ title: "Copied!" }); }}>Copy Content</Button>
                    </div>
                  )}
                </div>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};
