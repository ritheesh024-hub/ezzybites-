'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  ArrowUpDown, Ban, Power
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
import { FirestorePermissionError } from '@/firebase/errors';
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
  spiceLevel: 'None' | 'Mild' | 'Medium' | 'Hot' | 'Extra Hot';
  prepTime: number;
  stock: number;
  lowStockLevel: number;
}

const DEFAULT_FORM_DATA: ProductFormData = {
  name: '',
  description: '',
  category: 'Veg Maggie',
  price: 0,
  discountPrice: 0,
  imageUrl: '',
  isVeg: true,
  isAvailable: true,
  isBestSeller: false,
  isFeatured: false,
  spiceLevel: 'None',
  prepTime: 20,
  stock: 100,
  lowStockLevel: 10
};

export const ProductManagement = () => {
  const db = useFirestore();
  const productsQuery = useMemo(() => db ? query(collection(db, 'products')) : null, [db]);
  const { data: products, loading } = useCollection<FoodItem>(productsQuery);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Form State
  const [formData, setFormData] = useState<ProductFormData>(DEFAULT_FORM_DATA);

  const stats = useMemo(() => {
    if (!products) return { total: 0, active: 0, oos: 0, featured: 0 };
    return {
      total: products.length,
      active: products.filter(p => p.isAvailable).length,
      oos: products.filter(p => (p.stock || 0) <= 0).length,
      featured: products.filter(p => p.isFeatured).length
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? p.isAvailable : !p.isAvailable);
      const matchesStock = stockFilter === 'all' || (stockFilter === 'low' ? (p.stock || 0) <= (p.lowStockLevel || 10) : (p.stock || 0) > (p.lowStockLevel || 10));
      return matchesSearch && matchesCategory && matchesStatus && matchesStock;
    });
  }, [products, searchQuery, categoryFilter, statusFilter, stockFilter]);

  const handleOpenModal = (item: FoodItem | null = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name || '',
        description: item.description || '',
        category: item.category || 'Veg Maggie',
        price: item.price || 0,
        discountPrice: item.discountPrice || 0,
        imageUrl: item.imageUrl || '',
        isVeg: item.isVeg ?? true,
        isAvailable: item.isAvailable ?? true,
        isBestSeller: item.isBestSeller ?? false,
        isFeatured: item.isFeatured ?? false,
        spiceLevel: item.spiceLevel || 'None',
        prepTime: item.prepTime || 20,
        stock: item.stock || 0,
        lowStockLevel: item.lowStockLevel || 10
      });
    } else {
      setEditingItem(null);
      setFormData(DEFAULT_FORM_DATA);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!db || !formData.name || !formData.imageUrl) {
      toast({ variant: "destructive", title: "Validation Error", description: "Name and Image URL are required." });
      return;
    }

    setSaveLoading(true);
    const id = editingItem ? editingItem.id : `PROD-${Date.now()}`;
    const productRef = doc(db, 'products', id);
    const finalData = {
      ...formData,
      id,
      price: Number(formData.price),
      discountPrice: Number(formData.discountPrice || 0),
      stock: Number(formData.stock || 0),
      lowStockLevel: Number(formData.lowStockLevel || 10),
      prepTime: Number(formData.prepTime || 20),
      rating: editingItem?.rating || 4.5,
      createdAt: editingItem?.createdAt || serverTimestamp()
    };

    setDoc(productRef, finalData, { merge: true })
      .then(() => {
        toast({ title: editingItem ? "Product Updated" : "Product Created", description: `${formData.name} is now live.` });
        setIsModalOpen(false);
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: productRef.path,
          operation: editingItem ? 'update' : 'create',
          requestResourceData: finalData
        }));
      })
      .finally(() => setSaveLoading(false));
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'products', id))
      .then(() => toast({ title: "Product Deleted" }))
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `products/${id}`,
          operation: 'delete'
        }));
      });
  };

  const handleDuplicate = (item: FoodItem) => {
    const newItem = { ...item, id: `PROD-${Date.now()}`, name: `${item.name} (Copy)` };
    handleOpenModal(newItem as FoodItem);
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (!db || selectedIds.size === 0) return;
    const batch = writeBatch(db);
    
    selectedIds.forEach(id => {
      const ref = doc(db, 'products', id);
      if (action === 'delete') batch.delete(ref);
      else batch.update(ref, { isAvailable: action === 'activate' });
    });

    try {
      await batch.commit();
      toast({ title: `Bulk ${action} successful`, description: `${selectedIds.size} items updated.` });
      setSelectedIds(new Set());
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Bulk Action Failed" });
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black font-headline uppercase tracking-tighter">Product <span className="text-primary italic">Vault</span></h2>
          <p className="text-muted-foreground text-sm font-medium">Configure your menu, manage stock, and optimize visibility.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all">
          <Plus className="w-5 h-5" /> Create New Product
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard label="Total Products" value={stats.total} icon={LayoutGrid} color="bg-blue-50 text-blue-600" />
        <StatsCard label="Active Listings" value={stats.active} icon={CheckCircle2} color="bg-green-50 text-green-600" />
        <StatsCard label="Out of Stock" value={stats.oos} icon={AlertCircle} color="bg-red-50 text-red-600" />
        <StatsCard label="Featured Items" value={stats.featured} icon={Star} color="bg-orange-50 text-orange-600" />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center bg-white dark:bg-zinc-900 p-4 rounded-[2rem] border shadow-sm sticky top-24 z-30">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search products..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="h-12 pl-12 rounded-xl border-none bg-secondary/30 dark:bg-zinc-800 font-bold" 
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto overflow-x-auto scrollbar-hide pb-1">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-12 w-[140px] rounded-xl bg-secondary/30 border-none font-black uppercase text-[9px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-12 w-[120px] rounded-xl bg-secondary/30 border-none font-black uppercase text-[9px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="h-12 w-[120px] rounded-xl bg-secondary/30 border-none font-black uppercase text-[9px]">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">Any Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="instock">In Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] bg-zinc-900 text-white p-4 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-5">
           <span className="text-[10px] font-black uppercase tracking-widest pl-4">{selectedIds.size} Selected</span>
           <div className="h-4 w-px bg-white/20" />
           <div className="flex gap-2">
              <Button size="sm" onClick={() => handleBulkAction('activate')} className="bg-green-600 hover:bg-green-700 rounded-full h-10 px-6 font-black uppercase text-[8px]">Activate</Button>
              <Button size="sm" onClick={() => handleBulkAction('deactivate')} className="bg-orange-600 hover:bg-orange-700 rounded-full h-10 px-6 font-black uppercase text-[8px]">Deactivate</Button>
              <Button size="sm" onClick={() => handleBulkAction('delete')} className="bg-destructive hover:bg-destructive/80 rounded-full h-10 px-6 font-black uppercase text-[8px]">Delete</Button>
           </div>
           <button onClick={() => setSelectedIds(new Set())} className="pr-4 hover:opacity-50"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="py-40 text-center space-y-4">
          <Loader2 className="animate-spin mx-auto w-12 h-12 text-primary" />
          <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Synchronizing Inventory...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-24 text-center bg-white dark:bg-zinc-900 rounded-[3rem] border-2 border-dashed">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-black uppercase">No Products Found</h3>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or add a new dish.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((item) => (
            <Card key={item.id} className={cn(
              "rounded-[2rem] border-none shadow-lg overflow-hidden group hover:shadow-2xl transition-all relative bg-white dark:bg-zinc-900",
              selectedIds.has(item.id) && "ring-4 ring-primary"
            )}>
              <button 
                onClick={() => toggleSelect(item.id)}
                className={cn(
                  "absolute top-4 left-4 z-20 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                  selectedIds.has(item.id) ? "bg-primary border-primary text-white" : "bg-white/50 backdrop-blur border-white/20"
                )}
              >
                {selectedIds.has(item.id) && <Check className="w-4 h-4" />}
              </button>

              <div className="aspect-[4/3] relative overflow-hidden bg-secondary/50">
                <Image src={item.imageUrl} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" unoptimized />
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                   <Badge className={cn("border-none px-3 font-black text-[8px] uppercase", item.isAvailable ? "bg-green-500 text-white" : "bg-zinc-500 text-white")}>
                     {item.isAvailable ? 'Active' : 'Inactive'}
                   </Badge>
                   {item.isFeatured && <Badge className="bg-orange-500 text-white border-none px-3 font-black text-[8px] uppercase">Featured</Badge>}
                </div>
              </div>

              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-primary/60 tracking-widest">{item.category}</p>
                  <h4 className="font-black text-sm uppercase truncate leading-none">{item.name}</h4>
                </div>

                <div className="flex items-end justify-between border-t border-dashed pt-4">
                   <div>
                      <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Pricing</p>
                      <div className="flex items-center gap-2">
                         <span className="text-xl font-black text-primary italic">₹{item.price}</span>
                         {item.discountPrice! > 0 && <span className="text-[10px] line-through opacity-30">₹{item.discountPrice}</span>}
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Stock</p>
                      <Badge variant="secondary" className={cn(
                        "rounded-lg px-2 font-black text-[10px]",
                        (item.stock || 0) <= (item.lowStockLevel || 10) ? "text-red-600 bg-red-50" : ""
                      )}>
                        {item.stock} Units
                      </Badge>
                   </div>
                </div>

                <div className="flex gap-2 pt-2">
                   <Button onClick={() => handleOpenModal(item)} variant="outline" className="flex-1 rounded-xl h-10 font-black text-[9px] uppercase tracking-widest bg-secondary/30 border-none group-hover:bg-primary group-hover:text-white transition-colors">
                     Edit Details
                   </Button>
                   <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                       <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-secondary/30 border-none"><MoreVertical className="w-4 h-4" /></Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
                        <DropdownMenuItem onClick={() => handleDuplicate(item)} className="rounded-xl py-3 font-bold gap-3"><Copy className="w-4 h-4" /> Duplicate Dish</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleSelect(item.id)} className="rounded-xl py-3 font-bold gap-3"><Check className="w-4 h-4" /> {selectedIds.has(item.id) ? 'Deselect' : 'Select for Bulk'}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(item.id)} className="rounded-xl py-3 font-bold gap-3 text-destructive"><Trash2 className="w-4 h-4" /> Delete Product</DropdownMenuItem>
                     </DropdownMenuContent>
                   </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl rounded-[3rem] p-0 overflow-hidden border-none shadow-3xl bg-white dark:bg-zinc-950 max-h-[90vh] flex flex-col">
          <div className="p-8 bg-primary text-white shrink-0">
             <DialogHeader>
                <DialogTitle className="text-3xl font-black font-headline uppercase tracking-tighter">{editingItem ? 'Edit Product' : 'New Dish Selection'}</DialogTitle>
                <DialogDescription className="text-white/70 font-medium text-xs uppercase tracking-widest">Update catalog information and visibility logic.</DialogDescription>
             </DialogHeader>
          </div>

          <div className="p-10 space-y-10 overflow-y-auto scrollbar-hide flex-1">
             <div className="grid md:grid-cols-2 gap-10">
                {/* Left Col: Basics */}
                <div className="space-y-6">
                   <h5 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] border-b pb-2">Basic Identity</h5>
                   <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Product Name</Label>
                        <Input value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Flaming Chicken Momos" className="h-14 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-bold" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Description</Label>
                        <Textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the flavors and ingredients..." className="min-h-[100px] rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-medium text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Menu Category</Label>
                            <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                               <SelectTrigger className="h-14 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-bold"><SelectValue /></SelectTrigger>
                               <SelectContent className="rounded-2xl">{CATEGORIES.filter(c => c !== 'All').map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                         </div>
                         <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Preparation Time (Mins)</Label>
                            <div className="relative">
                               <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                               <Input type="number" value={formData.prepTime || 0} onChange={e => setFormData({...formData, prepTime: Number(e.target.value)})} className="h-14 pl-12 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-bold" />
                            </div>
                         </div>
                      </div>
                   </div>

                   <h5 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] border-b pb-2 pt-4">Visual Asset</h5>
                   <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Public Image URL</Label>
                        <Input value={formData.imageUrl || ''} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://..." className="h-14 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-bold" />
                      </div>
                      {formData.imageUrl && (
                        <div className="h-48 relative rounded-3xl overflow-hidden border-4 border-secondary/50">
                           <Image src={formData.imageUrl} alt="Preview" fill className="object-cover" unoptimized />
                        </div>
                      )}
                   </div>
                </div>

                {/* Right Col: Logistics & Pricing */}
                <div className="space-y-6">
                   <h5 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] border-b pb-2">Pricing & Logistics</h5>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Price (₹)</Label>
                        <Input type="number" value={formData.price || 0} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="h-14 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-bold" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Compare Price (₹)</Label>
                        <Input type="number" value={formData.discountPrice || 0} onChange={e => setFormData({...formData, discountPrice: Number(e.target.value)})} className="h-14 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-bold" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Stock Level</Label>
                        <Input type="number" value={formData.stock || 0} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="h-14 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-bold" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Low Stock Alert @</Label>
                        <Input type="number" value={formData.lowStockLevel || 0} onChange={e => setFormData({...formData, lowStockLevel: Number(e.target.value)})} className="h-14 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-bold" />
                      </div>
                   </div>

                   <h5 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] border-b pb-2 pt-4">Food Attributes</h5>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Dietary Type</Label>
                        <Select value={formData.isVeg ? 'veg' : 'non-veg'} onValueChange={v => setFormData({...formData, isVeg: v === 'veg'})}>
                           <SelectTrigger className="h-14 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-bold"><SelectValue /></SelectTrigger>
                           <SelectContent className="rounded-2xl">
                              <SelectItem value="veg">Vegetarian</SelectItem>
                              <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                           </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Spice Intensity</Label>
                        <Select value={formData.spiceLevel} onValueChange={(v: any) => setFormData({...formData, spiceLevel: v})}>
                           <SelectTrigger className="h-14 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-bold"><SelectValue /></SelectTrigger>
                           <SelectContent className="rounded-2xl">
                              <SelectItem value="None">No Spice</SelectItem>
                              <SelectItem value="Mild">Mild Heat</SelectItem>
                              <SelectItem value="Medium">Medium Kick</SelectItem>
                              <SelectItem value="Hot">Hot & Spicy</SelectItem>
                              <SelectItem value="Extra Hot">Blazing Heat</SelectItem>
                           </SelectContent>
                        </Select>
                      </div>
                   </div>

                   <h5 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] border-b pb-2 pt-4">Visibility Engine</h5>
                   <div className="space-y-4 pt-2">
                      <ToggleOption label="Active Listing" desc="Visible on public menu for ordering" checked={!!formData.isAvailable} onChange={v => setFormData({...formData, isAvailable: v})} icon={Power} />
                      <ToggleOption label="Featured Item" desc="Promote at the top of the homepage" checked={!!formData.isFeatured} onChange={v => setFormData({...formData, isFeatured: v})} icon={Sparkles} />
                      <ToggleOption label="Bestseller Badge" desc="Add priority badge for high conversion" checked={!!formData.isBestSeller} onChange={v => setFormData({...formData, isBestSeller: v})} icon={Flame} />
                   </div>
                </div>
             </div>
          </div>

          <DialogFooter className="p-8 bg-secondary/10 shrink-0 flex gap-4">
             <Button variant="outline" className="h-14 flex-1 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2" onClick={() => setIsModalOpen(false)}>Cancel</Button>
             <Button className="h-14 flex-1 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-primary text-white shadow-xl shadow-primary/20" onClick={handleSave} disabled={saveLoading}>
               {saveLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Check className="w-4 h-4 mr-2" />}
               Synchronize Document
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatsCard = ({ label, value, icon: Icon, color }: any) => (
  <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-zinc-900 p-6">
    <div className="flex justify-between items-start">
      <div className="space-y-1">
        <p className="text-[9px] font-black uppercase tracking-widest opacity-40">{label}</p>
        <h4 className="text-3xl font-black italic">{value}</h4>
      </div>
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </Card>
);

const ToggleOption = ({ label, desc, checked, onChange, icon: Icon }: any) => (
  <div className="flex items-center justify-between p-4 bg-secondary/30 dark:bg-zinc-800 rounded-2xl border border-transparent hover:border-primary/20 transition-all">
    <div className="flex gap-4 items-start">
      <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-700 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="font-black text-[11px] uppercase leading-none mb-1">{label}</p>
        <p className="text-[9px] font-medium opacity-50">{desc}</p>
      </div>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);
