
"use client"
import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { FoodCard } from '@/components/FoodCard';
import { CATEGORIES } from '@/app/lib/menu-data';
import { Search, Loader2, PackageX, AlertCircle, Filter, LayoutGrid, Square, Grid3X3, StretchHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { FoodItem, useStore } from '@/app/lib/store';
import { cn } from '@/lib/utils';

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const db = useFirestore();
  const { menuViewMode, setMenuViewMode } = useStore();

  const productsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'products'));
  }, [db]);

  const { data: menuItems, loading, error } = useCollection<FoodItem>(productsQuery);

  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    return menuItems.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 pt-28 md:pt-40">
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <Badge variant="outline" className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-primary border-primary/20">The Selection</Badge>
            <h1 className="text-5xl md:text-8xl font-headline font-black leading-none">Fresh <span className="text-primary">Bites</span> Only.</h1>
            <p className="text-muted-foreground max-w-2xl text-lg font-medium">
              Explore our chef-curated menu, from legendary Maggie variations to premium Hydrabadi specialties.
            </p>
          </div>
          
          {/* VIEW MODE TOGGLE */}
          <div className="flex bg-secondary/50 p-1.5 rounded-2xl border items-center shadow-sm w-fit self-start md:self-auto">
            <button 
              onClick={() => setMenuViewMode('small')}
              className={cn(
                "p-3 rounded-xl transition-all flex items-center gap-2",
                menuViewMode === 'small' ? "bg-white text-primary shadow-lg" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Compact</span>
            </button>
            <button 
              onClick={() => setMenuViewMode('big')}
              className={cn(
                "p-3 rounded-xl transition-all flex items-center gap-2",
                menuViewMode === 'big' ? "bg-white text-primary shadow-lg" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <StretchHorizontal className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Detailed</span>
            </button>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="sticky top-20 z-40 mb-16 space-y-6">
          <div className="glass p-3 md:p-5 rounded-[2.5rem] shadow-2xl flex flex-col lg:flex-row gap-4 items-center border border-white/20">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="What are you craving?" 
                className="h-16 pl-14 rounded-full border-none bg-secondary/40 text-lg font-bold placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex overflow-x-auto gap-3 pb-2 w-full lg:w-auto scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "rounded-full px-8 h-14 font-black uppercase text-[10px] tracking-widest transition-all shrink-0 border",
                    selectedCategory === cat 
                      ? "bg-primary text-white shadow-xl shadow-primary/20 border-primary" 
                      : "bg-white/50 border-muted hover:border-primary/40 hover:text-primary backdrop-blur"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-40 flex flex-col items-center gap-6">
             <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
               <Loader2 className="w-8 h-8 animate-spin text-primary" />
             </div>
             <p className="font-black uppercase tracking-widest text-xs text-muted-foreground">Kitchen is firing up...</p>
          </div>
        ) : error ? (
           <div className="py-40 text-center bg-destructive/5 rounded-[3rem] border-2 border-destructive/20 border-dashed">
             <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-6" />
             <p className="text-destructive font-black text-xl uppercase tracking-tighter">Inventory Sync Failed</p>
             <p className="text-sm text-muted-foreground mt-2 font-medium">Check your connection or refresh the page.</p>
           </div>
        ) : filteredItems.length > 0 ? (
          <div className={cn(
            "grid gap-6 md:gap-10 transition-all duration-500",
            menuViewMode === 'small' 
              ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6" 
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          )}>
            {filteredItems.map((item) => (
              <div key={item.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <FoodCard item={item} />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-40 text-center space-y-8">
            <div className="w-24 h-24 bg-secondary/50 rounded-full flex items-center justify-center mx-auto">
              <PackageX className="w-12 h-12 text-muted-foreground opacity-30" />
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-headline font-black">No matches found</h3>
              <p className="text-muted-foreground font-medium text-lg">Try a different category or clear your search.</p>
            </div>
            <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }} className="rounded-full h-14 px-10 font-black uppercase text-[10px] tracking-widest">
              Show All Dishes
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
