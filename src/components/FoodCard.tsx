"use client"
import React, { useState } from 'react';
import Image from 'next/image';
import { Star, Plus, Minus } from 'lucide-react';
import { FoodItem, useStore, BeverageOptions } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BeverageCustomizer } from './BeverageCustomizer';

interface FoodCardProps {
  item: FoodItem;
}

export const FoodCard = ({ item }: FoodCardProps) => {
  const { cart, addToCart, updateQuantity } = useStore();
  const [isCustomizing, setIsCustomizing] = useState(false);
  
  const cartItemCount = cart.filter(i => i.id === item.id).reduce((acc, i) => acc + i.quantity, 0);

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (item.isBeverage || item.isCustomizable) {
      setIsCustomizing(true);
    } else {
      addToCart(item);
      toast({ title: "Added to Tray", description: `${item.name} ready.` });
    }
  };

  const handleCustomizationConfirm = (options: BeverageOptions) => {
    addToCart(item, options);
    setIsCustomizing(false);
    toast({ title: "Custom Order Added", description: `${item.name} (${options.size}) added.` });
  };

  const handleQtyChange = (delta: number, e: React.MouseEvent) => {
    e.preventDefault();
    const targetItem = cart.find(i => i.id === item.id);
    if (targetItem) {
      updateQuantity(targetItem.cartId, delta);
    } else if (delta > 0) {
      handleAddClick(e);
    }
  };

  return (
    <>
      <div className="group bg-white dark:bg-zinc-900 rounded-[1.5rem] border border-border/40 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full relative">
        {/* IMAGE SECTION */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary/30">
          <Image 
            src={item.imageUrl} 
            alt={item.name} 
            fill 
            className="object-cover group-hover:scale-110 transition-transform duration-700" 
            unoptimized 
          />
          
          {/* BADGES OVERLAY */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
             <div className={cn(
               "w-4 h-4 bg-white/90 dark:bg-black/90 backdrop-blur rounded-[4px] border flex items-center justify-center shadow-sm",
               item.isVeg ? "border-green-500" : "border-red-500"
             )}>
              <div className={cn("w-1.5 h-1.5 rounded-full", item.isVeg ? "bg-green-500" : "bg-red-500")} />
            </div>
            
            <Badge className="bg-white/90 dark:bg-black/90 text-foreground border-none font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 text-[8px] shadow-sm">
              <Star className="w-2 h-2 fill-primary text-primary" />
              {item.rating || '4.5'}
            </Badge>
          </div>

          {item.isFeatured && (
            <div className="absolute bottom-0 left-0 right-0 bg-primary/90 py-0.5 text-[7px] font-black text-white text-center uppercase tracking-widest">
              Bestseller
            </div>
          )}
        </div>

        {/* CONTENT SECTION */}
        <div className="flex-1 flex flex-col p-3 md:p-4 min-w-0">
          <div className="flex-1">
            <h3 className="text-xs md:text-base font-black uppercase tracking-tight leading-tight line-clamp-2 mb-1">
              {item.name}
            </h3>
            <p className="text-[9px] md:text-xs text-muted-foreground line-clamp-1 opacity-60 font-medium mb-3">
              {item.description}
            </p>
          </div>

          <div className="flex items-center justify-between mt-auto gap-2">
            <div className="flex flex-col">
              <span className="text-sm md:text-xl font-black text-primary italic">₹{item.price}</span>
            </div>

            <div className="shrink-0">
              {cartItemCount > 0 ? (
                <div className="flex items-center gap-1.5 bg-primary text-white rounded-lg md:rounded-xl h-8 md:h-10 px-1 shadow-md">
                  <button onClick={(e) => handleQtyChange(-1, e)} className="p-1 hover:bg-white/20 rounded-md transition-colors"><Minus className="w-3 h-3" /></button>
                  <span className="text-[10px] md:text-xs font-black w-4 text-center">{cartItemCount}</span>
                  <button onClick={(e) => handleQtyChange(1, e)} className="p-1 hover:bg-white/20 rounded-md transition-colors"><Plus className="w-3 h-3" /></button>
                </div>
              ) : (
                <Button 
                  onClick={handleAddClick} 
                  className="rounded-lg md:rounded-xl h-8 md:h-10 px-3 md:px-5 font-black uppercase tracking-widest text-[8px] md:text-[10px] bg-white dark:bg-zinc-800 text-primary border-2 border-primary/20 hover:bg-primary hover:text-white transition-all shadow-sm"
                >
                  ADD <Plus className="ml-1 w-2.5 h-2.5 md:w-3 md:h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {(item.isBeverage || item.isCustomizable) && (
        <BeverageCustomizer item={item} isOpen={isCustomizing} onClose={() => setIsCustomizing(false)} onConfirm={handleCustomizationConfirm} />
      )}
    </>
  );
};
