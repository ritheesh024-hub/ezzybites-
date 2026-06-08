
"use client"
import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import { FoodCard } from '@/components/FoodCard';
import { Search, Loader2, PackageX, AlertCircle, Filter, Sparkles, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';
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
import { CATEGORIES } from '@/app/lib/menu-data';

function MenuContent() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  
  const db = useFirestore();

  useEffect(() => {
    if (urlQuery) setSearchQuery(urlQuery);
  }, [urlQuery]);

  const productsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'products'));
  }, [db]);

  const { data: menuItems, loading, error } = useCollection<FoodItem>(productsQuery);

  // Group items by category
  const categorizedItems = useMemo(() => {
    if (!menuItems) return {};
    
    const items = menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDiet = dietFilter === 'all' || 
                        (dietFilter === 'veg' && item.isVeg) || 
                        (dietFilter === 'non-veg' && !item.isVeg);
      return matchesSearch && matchesDiet;
    });

    const groups: Record<string, FoodItem[]> = {};
    
    // Add "Popular Today" section
    const popular = items.filter(i => i.isBestSeller || i.rating >= 4.8);
    if (popular.length > 0) groups['🔥 Popular Today'] = popular;

    // Group by standard categories
    CATEGORIES.forEach(cat => {
      if (cat === 'All') return;
      const catItems = items.filter(i => i.category === cat);
      if (catItems.length > 0) groups[cat] = catItems;
    });

    return groups;
  }, [menuItems, searchQuery, dietFilter]);

  const hasGroups = Object.keys(categorizedItems).length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-4 pt-20 md:pt-28">
        {/* COMPACT HERO */}
        <div className="mb-6 md:mb-10 space-y-2 text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-headline font-black tracking-tighter uppercase leading-none">
            Fresh <span className="text-primary italic">Selection.</span>
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm font-medium">Chef-curated meals delivered to your doorstep.</p>
        </div>

        {/* STICKY SEARCH & CATEGORY BAR */}
        <div className="sticky top-[4.5rem] md:top-20 z-40 mb-8 -mx-4 px-4 py-2 bg-background/80 backdrop-blur-xl border-b border-border/40">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
              <Input 
                placeholder="Search dishes, snacks..." 
                className="h-11 md:h-12 pl-12 rounded-2xl border-none bg-secondary/50 text-sm font-bold placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto scrollbar-hide pb-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDietFilter(dietFilter === 'veg' ? 'all' : 'veg')}
                className={cn(
                  "h-10 rounded-full px-4 gap-2 font-black uppercase text-[9px] tracking-widest shrink-0 border-2",
                  dietFilter === 'veg' ? "border-green-500 bg-green-50 text-green-700" : ""
                )}
              >
                Veg Only
              </Button>

              <div className="h-4 w-px bg-border shrink-0 mx-1" />

              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    const el = document.getElementById(`section-${cat}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="rounded-full px-5 h-10 font-black uppercase text-[9px] tracking-widest transition-all shrink-0 border bg-white dark:bg-zinc-900 border-muted hover:border-primary/40 hover:text-primary"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-6">
             <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center animate-pulse">
               <Loader2 className="w-8 h-8 animate-spin text-primary" />
             </div>
             <p className="font-black uppercase tracking-widest text-[9px] text-muted-foreground">Syncing Kitchen...</p>
          </div>
        ) : error ? (
           <div className="py-20 text-center bg-destructive/5 rounded-[2.5rem] border-2 border-destructive/20 border-dashed">
             <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-6" />
             <p className="text-destructive font-black text-lg uppercase tracking-tighter">Sync Failed</p>
             <p className="text-xs text-muted-foreground mt-2 font-medium">Check your connection or refresh.</p>
           </div>
        ) : hasGroups ? (
          <div className="space-y-12 md:space-y-20 pb-20">
            {Object.entries(categorizedItems).map(([category, items]) => (
              <section key={category} id={`section-${category}`} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between mb-4 md:mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                      {category.includes('Popular') ? <Sparkles className="w-5 h-5 md:w-6 md:h-6" /> : <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />}
                    </div>
                    <h2 className="text-xl md:text-3xl font-black font-headline uppercase tracking-tighter">{category}</h2>
                  </div>
                  <Badge variant="outline" className="rounded-full px-3 py-1 font-black text-[9px] opacity-40 uppercase">{items.length} items</Badge>
                </div>

                <div className="flex gap-4 md:gap-8 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 snap-x">
                  {items.map((item) => (
                    <div key={item.id} className="min-w-[240px] md:min-w-[320px] snap-center first:pl-0">
                      <FoodCard item={item} forceViewMode="big" />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center space-y-6">
            <div className="w-24 h-24 bg-secondary/50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
              <PackageX className="w-12 h-12 text-muted-foreground opacity-20" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black uppercase">No matches found</h3>
              <p className="text-muted-foreground text-sm font-medium">Try clearing your search or filters.</p>
            </div>
            <Button variant="outline" onClick={() => { setSearchQuery(''); setDietFilter('all'); }} className="rounded-full h-12 px-8 font-black uppercase text-[10px] tracking-widest border-2">
              Show Everything
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
      <MenuContent />
    </Suspense>
  );
}
