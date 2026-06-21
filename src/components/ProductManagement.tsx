
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
  ChevronRight
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
import { collection, query, doc, setDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { FoodItem } from '@/app/lib/store';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { CATEGORIES } from '@/app/lib/menu-data';

const ITEMS_PER_PAGE = 12;

export const ProductManagement = () => {
  const db = useFirestore();
  const productsQuery = useMemo(() => db ? query(collection(db, 'products'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: products, loading } = useCollection<FoodItem>(productsQuery);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    category: 'Biryani',
    price: 0,
    imageUrl: '',
    isAvailable: true,
    isFeatured: false
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
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
        isFeatured: item.isFeatured
      });
    } else {
      setEditingItem(null);
      setFormData({ name: '', description: '', category: 'Biryani', price: 0, imageUrl: '', isAvailable: true, isFeatured: false });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!db || !formData.name || !formData.imageUrl) return;
    setSaveLoading(true);
    const id = editingItem ? editingItem.id : `PROD-${Date.now()}`;
    const productRef = doc(db, 'products', id);
    const finalData = { ...formData, id, price: Number(formData.price), createdAt: editingItem?.createdAt || serverTimestamp() };

    setDoc(productRef, finalData, { merge: true })
      .then(() => {
        toast({ title: "Product Saved" });
        setIsModalOpen(false);
      })
      .finally(() => setSaveLoading(false));
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'products', id)).then(() => toast({ title: "Product Deleted" }));
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-1">
          <h2 className="text-4xl font-black font-headline uppercase tracking-tighter italic">Kitchen <span className="text-primary">Ledger</span></h2>
          <p className="text-muted-foreground text-sm font-medium tracking-tight">Catalog Items: {filteredProducts.length}</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="h-16 px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-3 bg-primary text-white shadow-3xl">
          <Plus className="w-5 h-5" /> Add Product
        </Button>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground opacity-40" />
          <Input 
            placeholder="Filter catalog..." 
            value={searchQuery} 
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
            className="h-14 pl-14 rounded-2xl border-none bg-secondary/30 dark:bg-zinc-800 font-bold" 
          />
        </div>
      </div>

      {loading ? (
        <div className="py-48 text-center"><Loader2 className="animate-spin mx-auto w-12 h-12 text-primary opacity-20" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {paginatedProducts.map((item) => (
              <Card key={item.id} className="rounded-[2.5rem] border-none shadow-xl overflow-hidden group bg-white dark:bg-zinc-900">
                <div className="aspect-[4/3] relative overflow-hidden bg-secondary/30">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" unoptimized />
                  <div className="absolute top-4 right-4"><Badge className={cn("px-4 py-1.5 rounded-full font-black text-[8px] uppercase", item.isAvailable ? "bg-emerald-500 text-white" : "bg-zinc-500 text-white")}>{item.isAvailable ? 'LIVE' : 'IDLE'}</Badge></div>
                </div>
                <CardContent className="p-8 space-y-6">
                  <h4 className="font-black text-base uppercase tracking-tight truncate leading-none mb-2">{item.name}</h4>
                  <div className="flex items-center justify-between pt-6 border-t border-dashed">
                     <span className="text-2xl font-black text-primary italic">₹{item.price}</span>
                     <div className="flex gap-2">
                        <Button onClick={() => handleOpenModal(item)} variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-none bg-secondary/30 hover:bg-primary hover:text-white transition-all"><Edit2 className="w-4 h-4" /></Button>
                        <Button onClick={() => handleDelete(item.id)} variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-none bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></Button>
                     </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-10">
               <Button variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="rounded-xl h-12 w-12 border-2"><ChevronLeft className="w-5 h-5" /></Button>
               <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Page {currentPage} of {totalPages}</span>
               <Button variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="rounded-xl h-12 w-12 border-2"><ChevronRight className="w-5 h-5" /></Button>
            </div>
          )}
        </>
      )}

      {/* DIALOG REMAINS SAME FOR SAVING */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl rounded-[3rem] p-0 overflow-hidden border-none shadow-3xl bg-white dark:bg-zinc-950">
          <div className="p-10 bg-primary text-white shrink-0">
             <DialogHeader>
                <DialogTitle className="text-4xl font-black font-headline uppercase tracking-tighter leading-none">{editingItem ? 'Edit Provision' : 'New Creation'}</DialogTitle>
                <DialogDescription className="text-white/70 font-medium text-xs uppercase tracking-widest mt-2">Syncing with Operational Registry</DialogDescription>
             </DialogHeader>
          </div>
          <div className="p-10 space-y-8">
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Entity Name" className="h-14 rounded-2xl bg-secondary/30 border-none font-bold" />
            <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="Unit Rate" className="h-14 rounded-2xl bg-secondary/30 border-none font-black" />
            <Input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="Media URL" className="h-14 rounded-2xl bg-secondary/30 border-none font-bold" />
            <Button className="w-full h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-primary text-white shadow-2xl" onClick={handleSave} disabled={saveLoading}>
              {saveLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Save Registry'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
