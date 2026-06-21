
"use client"
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Star, Plus, Minus, Heart, Eye } from 'lucide-react';
import { FoodItem, useStore, BeverageOptions } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BeverageCustomizer } from './BeverageCustomizer';
import { useAnalytics } from '@/hooks/use-analytics';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { AuthModal } from './AuthModal';
import { ProductDetails } from './ProductDetails';
import { motion } from 'framer-motion';

interface FoodCardProps {
  item: FoodItem;
}

export const FoodCard = ({ item }: FoodCardProps) => {
  const { cart, addToCart, updateQuantity } = useStore();
  const { user } = useUser();
  const db = useFirestore();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { trackProductView, trackAddToCart, trackEvent } = useAnalytics();
  
  const cartItemCount = cart.filter(i => i.id === item.id).reduce((acc, i) => acc + i.quantity, 0);

  // Favorites logic
  const favDocId = user ? `${user.uid}_${item.id}` : null;
  const favRef = (db && favDocId) ? doc(db, 'favorites', favDocId) : null;
  const { data: favoriteData } = useDoc<any>(favRef);
  const isFavorited = !!favoriteData;

  useEffect(() => {
    trackProductView(item);
  }, [item, trackProductView]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!db || !favRef) return;

    if (isFavorited) {
      await deleteDoc(favRef);
      trackEvent('remove_from_wishlist', { item_id: item.id, item_name: item.name });
    } else {
      await setDoc(favRef, {
        userId: user.uid,
        productId: item.id,
        product: item,
        createdAt: serverTimestamp()
      });
      trackEvent('add_to_wishlist', { item_id: item.id, item_name: item.name });
      toast({ title: "Saved to Favorites" });
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.isBeverage || item.isCustomizable) {
      setIsCustomizing(true);
    } else {
      addToCart(item);
      trackAddToCart(item);
      toast({ title: "Added to Tray" });
    }
  };

  const handleQtyChange = (delta: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const targetItem = cart.find(i => i.id === item.id);
    if (targetItem) {
      updateQuantity(targetItem.cartId, delta);
    } else if (delta > 0) {
      handleAddClick(e);
    }
  };

  const displayRating = item.reviewCount 
    ? (item.ratingSum! / item.reviewCount).toFixed(1) 
    : (item.rating || '4.5');

  return (
    <>
      <div 
        onClick={() => setIsDetailsOpen(true)}
        className="group bg-white dark:bg-zinc-900 rounded-[1.2rem] md:rounded-[1.5rem] border border-border/40 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full relative cursor-pointer"
      >
        {/* IMAGE SECTION */}
        <div className="relative aspect-video md:aspect-[4/3] w-full overflow-hidden bg-secondary/30">
          <Image 
            src={item.imageUrl} 
            alt={item.name} 
            fill 
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            className="object-cover group-hover:scale-110 transition-transform duration-700" 
            unoptimized 
            loading="lazy"
          />
          
          <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 flex flex-col gap-1">
             <div className={cn(
               "w-3.5 h-3.5 md:w-4 md:h-4 bg-white/90 dark:bg-black/90 backdrop-blur rounded-[3px] border flex items-center justify-center shadow-sm",
               item.isVeg ? "border-green-500" : "border-red-500"
             )}>
              <div className={cn("w-1 h-1 md:w-1.5 md:h-1.5 rounded-full", item.isVeg ? "bg-green-500" : "bg-red-500")} />
            </div>
            
            <Badge className="bg-white/90 dark:bg-black/90 text-foreground border-none font-black px-1 py-0.5 rounded-sm md:rounded-md flex items-center gap-1 text-[7px] md:text-[8px] shadow-sm">
              <Star className="w-1.5 h-1.5 md:w-2 md:h-2 fill-primary text-primary" />
              {displayRating}
            </Badge>
          </div>

          <button 
            onClick={toggleFavorite}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur flex items-center justify-center shadow-lg active:scale-75 transition-all z-10"
          >
            <Heart className={cn("w-4 h-4", isFavorited ? "fill-primary text-primary" : "text-muted-foreground")} />
          </button>
        </div>

        {/* CONTENT SECTION */}
        <div className="flex-1 flex flex-col p-2.5 md:p-4 min-w-0">
          <div className="flex-1">
            <h3 className="text-[11px] md:text-base font-black uppercase tracking-tight leading-tight line-clamp-1 md:line-clamp-2 mb-0.5 md:mb-1">
              {item.name}
            </h3>
            <p className="text-[8px] md:text-xs text-muted-foreground line-clamp-1 opacity-60 font-medium mb-2 md:mb-3">
              {item.description}
            </p>
          </div>

          <div className="flex items-center justify-between mt-auto gap-2">
            <span className="text-xs md:text-xl font-black text-primary italic">₹{item.price}</span>

            <div className="shrink-0">
              {cartItemCount > 0 ? (
                <div className="flex items-center gap-1 bg-primary text-white rounded-md md:rounded-xl h-7 md:h-10 px-1 shadow-md">
                  <button onClick={(e) => handleQtyChange(-1, e)} className="p-1 hover:bg-white/20 rounded-md transition-colors"><Minus className="w-2.5 h-2.5 md:w-3 md:h-3" /></button>
                  <span className="text-[9px] md:text-xs font-black w-3.5 text-center">{cartItemCount}</span>
                  <button onClick={(e) => handleQtyChange(1, e)} className="p-1 hover:bg-white/20 rounded-md transition-colors"><Plus className="w-2.5 h-2.5 md:w-3 md:h-3" /></button>
                </div>
              ) : (
                <Button 
                  onClick={handleAddClick} 
                  className="rounded-md md:rounded-xl h-7 md:h-10 px-2 md:px-5 font-black uppercase tracking-widest text-[7px] md:text-[10px] bg-white dark:bg-zinc-800 text-primary border-2 border-primary/20 hover:bg-primary hover:text-white transition-all shadow-sm"
                >
                  ADD <Plus className="ml-0.5 md:ml-1 w-2 md:w-3 h-2 md:h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {(item.isBeverage || item.isCustomizable) && (
        <BeverageCustomizer item={item} isOpen={isCustomizing} onClose={() => setIsCustomizing(false)} onConfirm={(opts) => { addToCart(item, opts); setIsCustomizing(false); }} />
      )}
      
      <ProductDetails item={item} isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} onAddToCart={() => { setIsDetailsOpen(false); handleAddClick({ preventDefault: () => {}, stopPropagation: () => {} } as any); }} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};
