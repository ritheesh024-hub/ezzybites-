
"use client"
import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { FoodCard } from '@/components/FoodCard';
import { CATEGORIES } from '@/app/lib/menu-data';
import { Search, Filter, Sparkles, Loader2, PackageX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const db = useFirestore();

  const menuQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'menu'), orderBy('name'));
  }, [db]);

  const { data: menuItems, loading } = useCollection<any>(menuQuery);

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
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-headline font-black mb-4">Our <span className="text-primary">Delicious</span> Menu</h1>
          <p className="text-muted-foreground max-w-2xl">
            From our signature Maggie recipes to authentic Hyderabadi Biryani, explore our chef-crafted menu.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search dishes..." 
              className="h-14 pl-12 rounded-2xl border-muted bg-secondary/50 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                variant={selectedCategory === cat ? "default" : "outline"}
                className={`rounded-full px-8 h-12 font-bold transition-all ${selectedCategory === cat ? 'shadow-lg shadow-primary/20' : 'hover:border-primary hover:text-primary'}`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
             <Loader2 className="w-10 h-10 animate-spin text-primary" />
             <p className="font-bold text-muted-foreground">Loading fresh menu...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredItems.map((item) => (
              <div key={item.id} className="animate-in fade-in slide-in-from-bottom duration-500">
                <FoodCard item={item} />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              {menuItems?.length === 0 ? <PackageX className="w-10 h-10 text-muted-foreground opacity-30" /> : <Search className="w-10 h-10 text-muted-foreground opacity-30" />}
            </div>
            <h3 className="text-2xl font-headline font-bold mb-2">
              {menuItems?.length === 0 ? "No items in menu" : "No dishes found"}
            </h3>
            <p className="text-muted-foreground">
              {menuItems?.length === 0 ? "The admin hasn't added any items yet." : "Try searching for something else or explore a different category."}
            </p>
            {menuItems?.length! > 0 && (
              <Button 
                variant="link" 
                onClick={() => {setSelectedCategory('All'); setSearchQuery('');}}
                className="mt-4 text-primary font-bold"
              >
                Clear all filters
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
