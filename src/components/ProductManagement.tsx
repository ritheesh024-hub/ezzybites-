"use client"
import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, Edit2, Trash2, 
  LayoutGrid, 
  Loader2, Package, Star, 
  Power,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Layers,
  Zap,
  X
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
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, doc, setDoc, deleteDoc, serverTimestamp, orderBy, writeBatch } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { FoodItem } from '@/app/lib/store';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { CATEGORIES, MENU_ITEMS } from '@/app/lib/menu-data';

const ITEMS_PER_PAGE = 20;

export const ProductManagement = () => {
  const db = useFirestore();
  const productsQuery = useMemo(() => db ? query(collection(db, 'products'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: products, loading } = useCollection<FoodItem>(productsQuery);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    category: 'Biryani',
    price: 0,
    imageUrl: '',
    isAvailable: true,
    isFeatured: false,
    isVeg: true
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handleOpenModal = (item: FoodItem | null = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description,
        category: item.category,
        price: item.price,
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
        isFeatured: item.isFeatured,
        isVeg: item.isVeg ?? true
      });
    } else {
      setEditingItem(null);
      setFormData({ name: '', description: '', category: 'Biryani', price: 0, imageUrl: '', isAvailable: true, isFeatured: false, isVeg: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!db || !formData.name || !formData.imageUrl) {
      toast({ variant: "destructive", title: "Incomplete Details" });
      return;
    }
    setSaveLoading(true);
    const id = editingItem ? editingItem.id : `PROD-${Date.now()}`;
    const productRef = doc(db, 'products', id);
    const finalData = { 
      ...formData, 
      id, 
      price: Number(formData.price), 
      updatedAt: serverTimestamp(),
      createdAt: editingItem?.createdAt || serverTimestamp() 
    };

    setDoc(productRef, finalData, { merge: true })
      .then(() => {
        toast({ title: "Inventory Updated" });
        setIsModalOpen(false);
      })
      .finally(() => setSaveLoading(false));
  };

  const handleSeedData = async () => {
    if (!db) return;
    setSeedLoading(true);
    try {
      const batch = writeBatch(db);
      MENU_ITEMS.forEach((item) => {
        const ref = doc(db, 'products', item.id);
        batch.set(ref, {
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
      toast({ title: "Inventory Seeded! 🚀", description: `${MENU_ITEMS.length} premium bites added to registry.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Seeding Failed", description: e.message });
    } finally {
      setSeedLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!db || !window.confirm("Permanently purge this item?")) return;
    deleteDoc(doc(db, 'products', id)).then(() => toast({ title: "Purge Successful" }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-black font-headline uppercase tracking-tighter italic">Stock <span className="text-primary">Registry</span></h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Inventory Node: {filteredProducts.length} Items</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline"
            onClick={handleSeedData} 
            disabled={seedLoading}
            className="h-11 px-6 rounded-xl font-black uppercase text-[9px] tracking-widest gap-2 border-2 flex-1 sm:flex-none"
          >
            {seedLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Seed Sample
          </Button>
          <Button onClick={() => handleOpenModal()} className="h-11 px-6 rounded-xl font-black uppercase text-[9px] tracking-widest gap-2 bg-primary shadow-lg flex-1 sm:flex-none">
            <Plus className="w-4 h-4" /> Provision Item
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-30" />
          <Input 
            placeholder="Search items or categories..." 
            value={searchQuery} 
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
            className="h-10 pl-10 rounded-xl border-none bg-secondary/40 font-bold text-sm" 
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-secondary/20 rounded-xl">
           <Filter className="w-3.5 h-3.5 text-primary opacity-40" />
           <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Filters Active</span>
        </div>
      </div>

      {loading ? (
        <div className="py-32 text-center"><Loader2 className="animate-spin mx-auto w-10 h-10 text-primary opacity-10" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {paginatedProducts.map((item) => (
              <Card key={item.id} className="rounded-2xl border-none shadow-sm overflow-hidden group bg-white dark:bg-zinc-900 flex flex-col h-full border hover:shadow-xl transition-all">
                <div className="aspect-[4/3] relative overflow-hidden bg-secondary/20 shrink-0">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-1000" unoptimized />
                  <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                     <Badge className={cn("px-2 py-0.5 rounded-md font-black text-[6px] uppercase border-none", item.isAvailable ? "bg-emerald-500 text-white" : "bg-zinc-500 text-white")}>
                       {item.isAvailable ? 'LIVE' : 'IDLE'}
                     </Badge>
                     {item.isFeatured && <Badge className="bg-primary text-white border-none text-[6px] font-black px-2 py-0.5 rounded-md">PROMO</Badge>}
                  </div>
                </div>
                <CardContent className="p-3.5 flex flex-col flex-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-[7px] font-black uppercase text-primary/40 tracking-widest mb-1">{item.category}</p>
                    <h4 className="font-black text-[11px] uppercase tracking-tight truncate leading-none mb-3">{item.name}</h4>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-dashed">
                     <span className="text-sm font-black text-primary italic">₹{item.price}</span>
                     <div className="flex gap-1.5">
                        <button onClick={() => handleOpenModal(item)} className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center hover:bg-primary hover:text-white transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                     </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-8">
               <Button variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="rounded-lg h-9 w-9 p-0 border-2"><ChevronLeft className="w-4 h-4" /></Button>
               <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Node {currentPage} / {totalPages}</span>
               <Button variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="rounded-lg h-9 w-9 p-0 border-2"><ChevronRight className="w-4 h-4" /></Button>
            </div>
          )}
        </>
      )}

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && setIsModalOpen(false)}>
        <DialogContent className="max-w-xl rounded-[2rem] p-0 overflow-hidden border-none shadow-3xl bg-white dark:bg-zinc-950">
          <div className="p-6 bg-primary text-white shrink-0 flex justify-between items-center">
             <DialogHeader>
                <DialogTitle className="text-2xl font-black font-headline uppercase tracking-tighter italic leading-none">{editingItem ? 'Edit Protocol' : 'New Entry'}</DialogTitle>
                <DialogDescription className="sr-only">Add or edit product inventory details.</DialogDescription>
             </DialogHeader>
          </div>
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase opacity-40 ml-1">Label</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Dish name" className="h-11 rounded-xl bg-secondary/30 border-none font-bold" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase opacity-40 ml-1">Valuation (₹)</Label>
                <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="h-11 rounded-xl bg-secondary/30 border-none font-black" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase opacity-40 ml-1">Cluster</Label>
                <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                   <SelectTrigger className="h-11 rounded-xl bg-secondary/30 border-none font-black uppercase text-[9px] tracking-widest px-4"><SelectValue /></SelectTrigger>
                   <SelectContent className="rounded-xl">
                      {CATEGORIES.filter(c => c !== 'All').map(c => <SelectItem key={c} value={c} className="font-bold text-[10px] uppercase">{c}</SelectItem>)}
                   </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase opacity-40 ml-1">Dietary Node</Label>
                <Select value={formData.isVeg ? 'veg' : 'nonveg'} onValueChange={v => setFormData({...formData, isVeg: v === 'veg'})}>
                   <SelectTrigger className="h-11 rounded-xl bg-secondary/30 border-none font-black uppercase text-[9px] tracking-widest px-4"><SelectValue /></SelectTrigger>
                   <SelectContent className="rounded-xl">
                      <SelectItem value="veg" className="font-bold text-[10px]">VEG</SelectItem>
                      <SelectItem value="nonveg" className="font-bold text-[10px]">NON-VEG</SelectItem>
                   </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase opacity-40 ml-1">Asset URL</Label>
              <Input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="h-11 rounded-xl bg-secondary/30 border-none font-medium" />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
                  <span className="text-[10px] font-black uppercase">Live Node</span>
                  <Switch checked={formData.isAvailable} onCheckedChange={v => setFormData({...formData, isAvailable: v})} />
               </div>
               <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
                  <span className="text-[10px] font-black uppercase">Featured</span>
                  <Switch checked={formData.isFeatured} onCheckedChange={v => setFormData({...formData, isFeatured: v})} />
               </div>
            </div>
          </div>
          <DialogFooter className="p-6 bg-zinc-50 dark:bg-zinc-900 border-t flex gap-2">
             <Button variant="outline" className="h-12 flex-1 rounded-xl font-black uppercase text-[9px] tracking-widest border-2" onClick={() => setIsModalOpen(false)}>Later</Button>
             <Button className="h-12 flex-[2] rounded-xl font-black uppercase text-[9px] tracking-widest bg-primary text-white shadow-xl shadow-primary/20" onClick={handleSave} disabled={saveLoading}>
               {saveLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Commit to Registry'}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
