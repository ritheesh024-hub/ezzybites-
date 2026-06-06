"use client"
import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { FoodCard } from '@/components/FoodCard';
import { CATEGORIES } from '@/app/lib/menu-data';
import { Search, Loader2, PackageX, AlertCircle, Filter, Grid3X3, StretchHorizontal, ArrowUpDown, Leaf, Flame } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { FoodItem, useStore } from '@/app/lib/store';
import { cn } from '@/lib/utils';

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceSort, setPriceSort] = useState<'none' | 'asc' | 'desc'>('none');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  
  const db = useFirestore();
  const { menuViewMode, setMenuViewMode } = useStore();

  const productsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'products'));
  }, [db]);

  const { data: menuItems, loading, error } = useCollection<FoodItem>(productsQuery);

  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    let items = menuItems.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDiet = dietFilter === 'all' || 
                        (dietFilter === 'veg' && item.isVeg) || 
                        (dietFilter === 'non-veg' && !item.isVeg);
      return matchesCategory && matchesSearch && matchesDiet;
    });

    if (priceSort === 'asc') items.sort((a, b) => a.price - b.price);
    if (priceSort === 'desc') items.sort((a, b) => b.price - a.price);
    
    return items;
  }, [menuItems, selectedCategory, searchQuery, priceSort, dietFilter]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24 md:pt-32">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-3">
            <Badge variant="outline" className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-primary border-primary/20">The Selection</Badge>
            <h1 className="text-4xl md:text-7xl font-headline font-black leading-none">Fresh <span className="text-primary">Bites</span> Only.</h1>
            <p className="text-muted-foreground max-w-2xl text-base md:text-lg font-medium">
              Explore our chef-curated menu, from legendary Maggie variations to premium Hydrabadi specialties.
            </p>
          </div>
          
          <div className="flex bg-secondary/50 p-1 rounded-2xl border items-center shadow-sm w-fit self-start md:self-auto">
            <button 
              onClick={() => setMenuViewMode('small')}
              className={cn(
                "p-2.5 rounded-xl transition-all flex items-center gap-2",
                menuViewMode === 'small' ? "bg-white dark:bg-zinc-800 text-primary shadow-lg" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Compact</span>
            </button>
            <button 
              onClick={() => setMenuViewMode('big')}
              className={cn(
                "p-2.5 rounded-xl transition-all flex items-center gap-2",
                menuViewMode === 'big' ? "bg-white dark:bg-zinc-800 text-primary shadow-lg" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <StretchHorizontal className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Detailed</span>
            </button>
          </div>
        </div>

        <div className="sticky top-20 z-40 mb-8">
          <div className="glass p-2 md:p-4 rounded-[2rem] shadow-2xl flex flex-col lg:flex-row gap-3 items-center border border-white/20">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="What are you craving?" 
                className="h-14 pl-14 rounded-full border-none bg-secondary/40 text-base font-bold placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-14 rounded-full px-5 gap-2 font-black uppercase text-[10px] tracking-widest shrink-0">
                    <Filter className="w-4 h-4" /> Filter & Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-2xl p-2" align="end">
                  <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-40">Dietary Preferences</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setDietFilter('all')} className="rounded-xl gap-2 font-bold text-sm">All Items</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDietFilter('veg')} className="rounded-xl gap-2 font-bold text-sm text-green-600">
                    <Leaf className="w-4 h-4" /> Veg Only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDietFilter('non-veg')} className="rounded-xl gap-2 font-bold text-sm text-red-600">
                    <Flame className="w-4 h-4" /> Non-Veg
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-40">Sort by Price</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setPriceSort('asc')} className="rounded-xl gap-2 font-bold text-sm">
                    <ArrowUpDown className="w-4 h-4" /> Low to High
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriceSort('desc')} className="rounded-xl gap-2 font-bold text-sm">
                    <ArrowUpDown className="w-4 h-4" /> High to Low
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex overflow-x-auto gap-2 pb-1 w-full lg:w-auto scrollbar-hide">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "rounded-full px-6 h-14 font-black uppercase text-[9px] tracking-widest transition-all shrink-0 border",
                      selectedCategory === cat 
                        ? "bg-primary text-white shadow-xl shadow-primary/20 border-primary" 
                        : "bg-white/50 dark:bg-zinc-800/50 border-muted hover:border-primary/40 hover:text-primary backdrop-blur"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-6">
             <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
               <Loader2 className="w-8 h-8 animate-spin text-primary" />
             </div>
             <p className="font-black uppercase tracking-widest text-xs text-muted-foreground">Kitchen is firing up...</p>
          </div>
        ) : error ? (
           <div className="py-20 text-center bg-destructive/5 rounded-[3rem] border-2 border-destructive/20 border-dashed">
             <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-6" />
             <p className="text-destructive font-black text-xl uppercase tracking-tighter">Inventory Sync Failed</p>
             <p className="text-sm text-muted-foreground mt-2 font-medium">Check your connection or refresh the page.</p>
           </div>
        ) : filteredItems.length > 0 ? (
          <div className={cn(
            "grid gap-4 md:gap-8 transition-all duration-500",
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
          <div className="py-24 text-center space-y-8">
            <div className="w-24 h-24 bg-secondary/50 rounded-full flex items-center justify-center mx-auto">
              <PackageX className="w-12 h-12 text-muted-foreground opacity-30" />
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-headline font-black">No matches found</h3>
              <p className="text-muted-foreground font-medium text-lg">Try a different category or clear your search.</p>
            </div>
            <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setDietFilter('all'); }} className="rounded-full h-14 px-10 font-black uppercase text-[10px] tracking-widest">
              Show All Dishes
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}