"use client"
import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, Search, Edit2, Trash2, Copy, 
  LayoutGrid, AlertCircle, CheckCircle2, 
  Loader2, Filter, Package, Star, 
  Flame, Clock, ChevronDown, Check,
  MoreVertical, X, Sparkles, Box,
  ArrowUpDown, Ban, Power,
  ChevronRight,
  Layers,
  Settings2
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, doc, setDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { FoodItem } from '@/app/lib/store';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { CATEGORIES } from '@/app/lib/menu-data';

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  discountPrice: number;
  imageUrl: string;
  isVeg: boolean;
  isAvailable: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  isCustomizable: boolean;
  spiceLevel: 'None' | 'Mild' | 'Medium' | 'Hot' | 'Extra Hot';
  prepTime: number;
}

const DEFAULT_FORM_DATA: ProductFormData = {
  name: '',
  description: '',
  category: 'Biryani',
  price: 0,
  discountPrice: 0,
  imageUrl: '',
  isVeg: true,
  isAvailable: true,
  isBestSeller: false,
  isFeatured: false,
  isCustomizable: false,
  spiceLevel: 'None',
  prepTime: 20
};

export const ProductManagement = () => {
  const db = useFirestore();
  const productsQuery = useMemo(() => db ? query(collection(db, 'products'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: products, loading } = useCollection<FoodItem>(productsQuery);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState<ProductFormData>(DEFAULT_FORM_DATA);

  const stats = useMemo(() => {
    if (!products) return { total: 0, active: 0, featured: 0, categoryCounts: {} as Record<string, number> };
    const counts: Record<string, number> = {};
    products.forEach(p => {
      const cat = p.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return {
      total: products.length,
      active: products.filter(p => p.isAvailable).length,
      featured: products.filter(p => p.isFeatured).length,
      categoryCounts: counts
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? p.isAvailable : !p.isAvailable);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, selectedCategory, statusFilter]);

  const handleOpenModal = (item: FoodItem | null = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name || '',
        description: item.description || '',
        category: item.category || 'Biryani',
        price: item.price || 0,
        discountPrice: item.discountPrice || 0,
        imageUrl: item.imageUrl || '',
        isVeg: item.isVeg ?? true,
        isAvailable: item.isAvailable ?? true,
        isBestSeller: item.isBestSeller ?? false,
        isFeatured: item.isFeatured ?? false,
        isCustomizable: item.isCustomizable ?? false,
        spiceLevel: item.spiceLevel || 'None',
        prepTime: item.prepTime || 20
      });
    } else {
      setEditingItem(null);
      setFormData(DEFAULT_FORM_DATA);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!db || !formData.name || !formData.imageUrl) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Identity and Media are mandatory." });
      return;
    }

    setSaveLoading(true);
    const id = editingItem ? editingItem.id : `PROD-${Date.now()}`;
    const productRef = doc(db, 'products', id);
    const finalData = {
      ...formData,
      id,
      price: Number(formData.price || 0),
      discountPrice: Number(formData.discountPrice || 0),
      prepTime: Number(formData.prepTime || 20),
      rating: editingItem?.rating || 4.5,
      createdAt: editingItem?.createdAt || serverTimestamp()
    };

    setDoc(productRef, finalData, { merge: true })
      .then(() => {
        toast({ title: editingItem ? "Registry Updated" : "Identity Created", description: `${formData.name} sync complete.` });
        setIsModalOpen(false);
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: productRef.path,
          operation: editingItem ? 'update' : 'create',
          requestResourceData: finalData
        } satisfies SecurityRuleContext));
      })
      .finally(() => setSaveLoading(false));
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'products', id))
      .then(() => toast({ title: "Product Terminated" }))
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `products/${id}`,
          operation: 'delete'
        } satisfies SecurityRuleContext));
      });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black font-headline uppercase tracking-tighter">Kitchen <span className="text-primary italic">Ledger</span></h2>
          <p className="text-muted-foreground text-sm font-medium">Provision menu items and optimize visibility parameters.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="h-14 px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 bg-primary shadow-xl shadow-primary/20">
          <Plus className="w-5 h-5" /> Provision New Dish
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard label="Total Catalog" value={stats.total} icon={LayoutGrid} color="bg-blue-50 text-blue-600" />
        <StatsCard label="Live Listings" value={stats.active} icon={CheckCircle2} color="bg-green-50 text-green-600" />
        <StatsCard label="Featured Showcase" value={stats.featured} icon={Star} color="bg-orange-50 text-orange-600" />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-center bg-white dark:bg-zinc-900 p-4 rounded-[2.5rem] border shadow-sm sticky top-24 z-30">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Filter by dish name..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="h-14 pl-14 rounded-2xl border-none bg-secondary/40 dark:bg-zinc-800 font-bold" 
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
             <SelectTrigger className="h-14 w-full lg:w-48 rounded-2xl bg-secondary/40 dark:bg-zinc-800 border-none font-black uppercase text-[10px] tracking-widest px-6"><SelectValue placeholder="Cuisine" /></SelectTrigger>
             <SelectContent className="rounded-2xl">{CATEGORIES.map(c => <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="py-40 text-center space-y-6">
          <div className="relative inline-block">
             <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] animate-pulse" />
             <Loader2 className="animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-primary" />
          </div>
          <p className="font-black uppercase tracking-[0.4em] text-[10px] text-muted-foreground animate-pulse">Syncing Cloud Catalog...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-32 text-center bg-white dark:bg-zinc-900 rounded-[4rem] border-2 border-dashed">
          <Package className="w-20 h-20 mx-auto mb-6 opacity-10" />
          <h3 className="text-2xl font-black uppercase tracking-tighter">Null Result</h3>
          <p className="text-sm font-medium text-muted-foreground mt-2 max-w-xs mx-auto">No products matched your current operational filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((item) => (
            <Card key={item.id} className="rounded-[2.5rem] border-none shadow-xl overflow-hidden group hover:shadow-2xl transition-all relative bg-white dark:bg-zinc-900">
              <div className="aspect-[4/3] relative overflow-hidden bg-secondary/30">
                <Image src={item.imageUrl} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" unoptimized />
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                   <Badge className={cn("border-none px-4 py-1 rounded-full font-black text-[8px] uppercase tracking-widest shadow-xl", item.isAvailable ? "bg-green-500 text-white" : "bg-zinc-500 text-white")}>
                     {item.isAvailable ? 'LIVE' : 'IDLE'}
                   </Badge>
                </div>
              </div>
              <CardContent className="p-8 space-y-6">
                <div>
                  <h4 className="font-black text-base uppercase tracking-tight truncate leading-none group-hover:text-primary transition-colors mb-2">{item.name}</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-60 italic">{item.category}</p>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-dashed">
                   <div>
                      <p className="text-[8px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Pricing</p>
                      <span className="text-2xl font-black text-primary italic">₹{item.price}</span>
                   </div>
                   <div className="flex gap-2">
                      <Button onClick={() => handleOpenModal(item)} variant="outline" size="icon" className="h-12 w-12 rounded-2xl bg-secondary/30 border-none hover:bg-primary hover:text-white transition-all"><Edit2 className="w-4 h-4" /></Button>
                      <Button onClick={() => handleDelete(item.id)} variant="outline" size="icon" className="h-12 w-12 rounded-2xl bg-destructive/10 border-none hover:bg-destructive hover:text-white transition-all text-destructive"><Trash2 className="w-4 h-4" /></Button>
                   </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl rounded-[3rem] p-0 overflow-hidden border-none shadow-3xl bg-white dark:bg-zinc-950 max-h-[90vh] flex flex-col">
          <div className="p-10 bg-primary text-white shrink-0 relative overflow-hidden">
             <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
             <DialogHeader className="relative z-10">
                <DialogTitle className="text-4xl font-black font-headline uppercase tracking-tighter leading-none">{editingItem ? 'Edit Provision' : 'New Creation'}</DialogTitle>
                <DialogDescription className="text-white/70 font-medium text-xs uppercase tracking-[0.2em] mt-2">Operational Registry Sync</DialogDescription>
             </DialogHeader>
          </div>

          <div className="p-10 space-y-10 overflow-y-auto scrollbar-hide flex-1">
             <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h5 className="text-[10px] font-black uppercase text-primary tracking-[0.3em] border-b pb-2">Manifest Identity</h5>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Dish Name</Label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-14 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Provision Category</Label>
                    <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                      <SelectTrigger className="h-14 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-2xl">{CATEGORIES.filter(c => c !== 'All').map(c => <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-6">
                  <h5 className="text-[10px] font-black uppercase text-primary tracking-[0.3em] border-b pb-2">Economics & Logistics</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Base Price (₹)</Label>
                      <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="h-14 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Prep Time (M)</Label>
                      <Input type="number" value={formData.prepTime} onChange={e => setFormData({...formData, prepTime: Number(e.target.value)})} className="h-14 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-bold" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-secondary/30 dark:bg-zinc-800 rounded-2xl">
                     <div className="flex gap-3 items-center">
                        <Power className="w-4 h-4 text-primary" />
                        <span className="text-[11px] font-black uppercase">Live Active</span>
                     </div>
                     <Switch checked={formData.isAvailable} onCheckedChange={v => setFormData({...formData, isAvailable: v})} />
                  </div>
                </div>
             </div>

             <div className="space-y-4">
                <h5 className="text-[10px] font-black uppercase text-primary tracking-[0.3em] border-b pb-2">Digital Asset (Image URL)</h5>
                <Input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://cloud.ezzybites.com/image.jpg" className="h-14 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-bold" />
             </div>
          </div>

          <DialogFooter className="p-10 bg-secondary/30 shrink-0 flex gap-4">
             <Button variant="outline" className="h-16 flex-1 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2" onClick={() => setIsModalOpen(false)}>Cancel</Button>
             <Button className="h-16 flex-1 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-primary text-white shadow-2xl shadow-primary/30" onClick={handleSave} disabled={saveLoading}>
               {saveLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Commit to Cloud'}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatsCard = ({ label, value, icon: Icon, color }: any) => (
  <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-zinc-900 p-8 flex justify-between items-start group hover:scale-[1.02] transition-transform">
    <div className="space-y-1">
      <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">{label}</p>
      <h4 className="text-4xl font-black italic">{value}</h4>
    </div>
    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:shadow-lg shadow-inner", color)}>
      <Icon className="w-7 h-7" />
    </div>
  </Card>
);
