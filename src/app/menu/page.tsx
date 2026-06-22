"use client"
import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import { FoodCard } from '@/components/FoodCard';
import { Search, Loader2, PackageX, AlertCircle, FilterX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import { FoodItem } from '@/app/lib/store';
import { cn } from '@/lib/utils';
import { CATEGORIES } from '@/app/lib/menu-data';
import { useAnalytics } from '@/hooks/use-analytics';

// Custom hook for search debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function MenuContent() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [activeCategory, setActiveCategory] = useState('All');
  
  const db = useFirestore();
  const { trackMenuView, trackCategoryView } = useAnalytics();

  useEffect(() => {
    trackMenuView();
  }, [trackMenuView]);

  useEffect(() => {
    if (urlQuery) setSearchQuery(urlQuery);
  }, [urlQuery]);

  const productsQuery = useMemo(() => {
    if (!db) return null;
    // High-integrity query node for full catalog access
    return query(collection(db, 'products'), limit(150));
  }, [db]);

  const { data: menuItems, loading, error } = useCollection<FoodItem>(productsQuery);

  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    
    return menuItems.filter(item => {
      const search = debouncedSearch.toLowerCase();
      const name = item.name?.toLowerCase() || '';
      const desc = item.description?.toLowerCase() || '';
      const cat = item.category?.toLowerCase() || '';

      const matchesSearch = !search || 
                           name.includes(search) || 
                           desc.includes(search) ||
                           cat.includes(search);
                           
      const matchesDiet = dietFilter === 'all' || 
                        (dietFilter === 'veg' && item.isVeg) || 
                        (dietFilter === 'non-veg' && !item.isVeg);
                        
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      
      return matchesSearch && matchesDiet && matchesCategory;
    });
  }, [menuItems, debouncedSearch, dietFilter, activeCategory]);

  const filterChips = [
    { label: 'All', value: 'all', type: 'category' },
    { label: 'Veg', value: 'veg', type: 'diet' },
    { label: 'Non Veg', value: 'non-veg', type: 'diet' },
    ...CATEGORIES.filter(c => c !== 'All').map(c => ({ label: c, value: c, type: 'category' }))
  ];

  const handleChipClick = (chip: any) => {
    if (chip.type === 'diet') {
      setDietFilter(dietFilter === chip.value ? 'all' : chip.value);
    } else {
      const category = chip.value === 'all' ? 'All' : chip.value;
      setActiveCategory(category);
      if (category !== 'All') {
        trackCategoryView(category);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-zinc-950">
      <Navbar />
      
      <main className="container mx-auto px-3 md:px-8 py-4 pt-14 md:pt-20 max-w-7xl">
        <div className="max-w-2xl mx-auto mb-4">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
            <Input 
              placeholder="Search premium bites..." 
              className="h-11 pl-12 rounded-xl border-none bg-white dark:bg-zinc-900 text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              >
                <FilterX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="sticky top-[48px] md:top-14 z-40 -mx-3 px-3 py-2 bg-[#F8F9FA]/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b border-border/40 mb-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide snap-x">
            {filterChips.map((chip, idx) => {
              const isActive = (chip.type === 'diet' && dietFilter === chip.value) || 
                             (chip.type === 'category' && (activeCategory === chip.label || (activeCategory === 'All' && chip.value === 'all')));
              
              return (
                <button
                  key={idx}
                  onClick={() => handleChipClick(chip)}
                  className={cn(
                    "rounded-full px-3.5 h-8 font-black uppercase text-[8px] tracking-widest transition-all shrink-0 border snap-start flex items-center gap-1.5",
                    isActive 
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/10" 
                      : "bg-white dark:bg-zinc-900 border-muted text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {chip.type === 'diet' && chip.value !== 'all' && (
                    <div className={cn("w-1 h-1 rounded-full", chip.value === 'veg' ? "bg-green-500" : "bg-red-500")} />
                  )}
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <div key={i} className="aspect-[4/3] rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : error ? (
           <div className="py-20 text-center bg-destructive/5 rounded-3xl border-2 border-destructive/10 border-dashed max-w-xl mx-auto p-8">
             <AlertCircle className="w-12 h-12 text-destructive/30 mx-auto mb-4" />
             <h3 className="text-xl font-black uppercase text-destructive tracking-tighter mb-2">Sync Error</h3>
             <p className="text-[10px] font-black uppercase mb-6 text-muted-foreground opacity-60">Identity Sync Interrupted. Re-establish handshake?</p>
             <Button variant="outline" className="rounded-full h-10 px-8 border-destructive/20 text-destructive font-black uppercase text-[9px]" onClick={() => window.location.reload()}>Retry Handshake</Button>
           </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-5 pb-10">
            {filteredItems.map((item) => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center space-y-6 max-w-lg mx-auto">
            <div className="w-20 h-20 bg-secondary/50 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <PackageX className="w-8 h-8 text-muted-foreground opacity-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black uppercase tracking-tighter">No Matches Found</h3>
              <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-widest">Adjust filters or search criteria.</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => { setSearchQuery(''); setDietFilter('all'); setActiveCategory('All'); }} 
              className="rounded-full h-11 px-8 font-black uppercase text-[9px] tracking-widest border-2"
            >
              Reset Protocol
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}
