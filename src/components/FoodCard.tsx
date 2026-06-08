
"use client"
import React, { useState } from 'react';
import Image from 'next/image';
import { Star, Plus, Minus, Clock, Coffee, Sparkles, Settings2, Flame, Leaf } from 'lucide-react';
import { FoodItem, useStore, BeverageOptions } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BeverageCustomizer } from './BeverageCustomizer';

interface FoodCardProps {
  item: FoodItem;
  forceViewMode?: 'small' | 'big';
}

export const FoodCard = ({ item, forceViewMode }: FoodCardProps) => {
  const { cart, addToCart, updateQuantity } = useStore();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  const cartItemCount = cart.filter(i => i.id === item.id).reduce((acc, i) => acc + i.quantity, 0);

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (item.isBeverage || item.isCustomizable) {
      setIsCustomizing(true);
    } else {
      addToCart(item);
      toast({
        title: "Added to Tray",
        description: `${item.name} ready for checkout.`,
      });
    }
  };

  const handleCustomizationConfirm = (options: BeverageOptions) => {
    addToCart(item, options);
    setIsCustomizing(false);
    toast({
      title: "Custom Order Added",
      description: `${item.name} (${options.size}) added.`,
    });
  };

  const handleQtyChange = (delta: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (item.isBeverage || item.isCustomizable) {
       if (delta > 0) setIsCustomizing(true);
       else toast({ title: "Manage in Cart", description: "Use the tray drawer to adjust customizations." });
       return;
    }
    
    const targetItem = cart.find(i => i.id === item.id);
    if (targetItem) {
      updateQuantity(targetItem.cartId, delta);
    }
  };

  return (
    <>
      <div className="group bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col h-full relative overflow-hidden border border-border/20 perspective-1000">
        {/* Visual Header */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image 
            src={item.imageUrl} 
            alt={item.name} 
            fill 
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            unoptimized
            onError={() => setImgError(true)}
          />
          
          {/* Badges Overlay */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            {item.isBestSeller && (
              <Badge className="bg-orange-gradient text-white border-none px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-xl">
                <Sparkles className="w-3 h-3 mr-1" /> Bestseller
              </Badge>
            )}
            <Badge className="bg-white/90 dark:bg-black/90 backdrop-blur text-foreground border-none shadow-xl font-black px-2 py-1 rounded-lg flex items-center gap-1.5 text-[10px]">
              <Star className="w-3 h-3 fill-primary text-primary" />
              {item.rating || '4.5'}
            </Badge>
          </div>

          <div className="absolute bottom-4 right-4 z-10">
            <div className={cn(
              "w-6 h-6 bg-white/90 dark:bg-black/90 backdrop-blur rounded-lg border-2 flex items-center justify-center shadow-lg",
              item.isVeg ? "border-green-500" : "border-red-500"
            )}>
              <div className={cn("w-2 h-2 rounded-full", item.isVeg ? "bg-green-500" : "bg-red-500")} />
            </div>
          </div>
          
          {/* Prep Time Overlay */}
          <div className="absolute bottom-4 left-4 z-10">
            <Badge variant="secondary" className="bg-black/40 backdrop-blur-md text-white border-none font-black px-2 py-1 rounded-lg text-[8px] uppercase tracking-widest">
              <Clock className="w-2.5 h-2.5 mr-1" /> {item.prepTime || 20}m
            </Badge>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 md:p-6 flex flex-col flex-1 space-y-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex justify-between items-start gap-2">
              <h3 className="text-base md:text-lg font-black uppercase tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                {item.name}
              </h3>
              {item.isCustomizable && <Settings2 className="w-4 h-4 text-primary shrink-0 opacity-40" />}
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">
              {item.description}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Best Price</span>
              <span className="text-xl md:text-2xl font-black text-primary italic leading-none">₹{item.price}</span>
            </div>

            {cartItemCount > 0 && !item.isBeverage && !item.isCustomizable ? (
              <div className="flex items-center gap-3 bg-orange-gradient text-white rounded-2xl h-11 px-3 shadow-xl shadow-primary/20 animate-in zoom-in duration-300">
                <button onClick={(e) => handleQtyChange(-1, e)} className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"><Minus className="w-4 h-4" /></button>
                <span className="text-sm font-black w-4 text-center">{cartItemCount}</span>
                <button onClick={(e) => handleQtyChange(1, e)} className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"><Plus className="w-4 h-4" /></button>
              </div>
            ) : (
              <Button 
                onClick={handleAddClick}
                className="rounded-xl px-5 h-11 font-black uppercase tracking-widest text-[9px] bg-orange-gradient text-white border-none shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                Add
                <Plus className="ml-1.5 w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {(item.isBeverage || item.isCustomizable) && (
        <BeverageCustomizer 
          item={item} 
          isOpen={isCustomizing} 
          onClose={() => setIsCustomizing(false)} 
          onConfirm={handleCustomizationConfirm} 
        />
      )}
    </>
  );
};
