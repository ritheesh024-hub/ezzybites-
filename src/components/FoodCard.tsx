
"use client"
import React, { useState } from 'react';
import Image from 'next/image';
import { Star, Plus, Minus, Clock, Coffee, Sparkles, Settings2 } from 'lucide-react';
import { FoodItem, useStore, BeverageOptions } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BeverageCustomizer } from './BeverageCustomizer';
import { useIsMobile } from '@/hooks/use-mobile';
import placeholderData from '@/app/lib/placeholder-images.json';

interface FoodCardProps {
  item: FoodItem;
  forceViewMode?: 'small' | 'big';
}

export const FoodCard = ({ item, forceViewMode }: FoodCardProps) => {
  const { cart, addToCart, updateQuantity, menuViewMode: storeViewMode } = useStore();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const isMobile = useIsMobile();
  const [imgError, setImgError] = useState(false);
  
  const menuViewMode = forceViewMode || storeViewMode;
  const hideVegIndicator = ['Tea', 'Coffee', 'Ice teas'].includes(item.category);
  const cartItemCount = cart.filter(i => i.id === item.id).reduce((acc, i) => acc + i.quantity, 0);

  // Mobile Biryani Image Logic
  const mobileBiryaniUrl = placeholderData.placeholderImages.find(img => img.id === 'biryani-mobile-featured')?.imageUrl || '';
  const isBiryaniOnMobile = isMobile && item.category?.toLowerCase() === 'biryani';
  const displayImageUrl = (isBiryaniOnMobile && !imgError) ? mobileBiryaniUrl : item.imageUrl;

  const handleAddClick = () => {
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

  const handleQtyChange = (delta: number) => {
    if (item.isBeverage || item.isCustomizable) {
       if (delta > 0) setIsCustomizing(true);
       else toast({ title: "Manage in Cart", description: "Use the tray drawer to remove specific customizations." });
       return;
    }
    
    const targetItem = cart.find(i => i.id === item.id);
    if (targetItem) {
      updateQuantity(targetItem.cartId, delta);
    }
  };

  if (menuViewMode === 'small') {
    return (
      <>
        <div className="group bg-white dark:bg-zinc-900 rounded-[1.5rem] md:rounded-[2rem] shadow-soft hover:shadow-xl transition-all duration-500 flex flex-col h-full relative overflow-hidden border border-border/20">
          <div className="relative aspect-square overflow-hidden bg-secondary/30">
            <Image 
              src={displayImageUrl} 
              alt={item.name} 
              fill 
              className="object-cover group-hover:scale-110 transition-transform duration-700"
              unoptimized
              onError={() => setImgError(true)}
              data-ai-hint={isBiryaniOnMobile ? "chicken biryani" : "fast food"}
            />
            {item.rating >= 4.7 && (
               <div className="absolute top-2 left-2 z-10 glass px-1.5 py-0.5 rounded-lg flex items-center gap-1">
                 <Star className="w-2 h-2 fill-primary text-primary" />
                 <span className="text-[7px] font-black text-primary">{item.rating}</span>
               </div>
            )}
            {!hideVegIndicator && (
              <div className="absolute top-2 right-2 z-10">
                <div className={cn(
                  "w-3 h-3 bg-white/90 backdrop-blur rounded-sm border flex items-center justify-center",
                  item.isVeg ? "border-green-500" : "border-red-500"
                )}>
                  <div className={cn("w-1 h-1 rounded-full", item.isVeg ? "bg-green-500" : "bg-red-500")} />
                </div>
              </div>
            )}
          </div>
          <div className="p-3 md:p-4 flex flex-col flex-1">
            <h4 className="font-black text-[10px] md:text-sm line-clamp-1 mb-1 uppercase tracking-tight group-hover:text-primary transition-colors">{item.name}</h4>
            <div className="mt-auto flex items-center justify-between">
              <span className="text-xs md:text-base font-black text-primary italic">₹{item.price}</span>
              {cartItemCount > 0 && !item.isBeverage && !item.isCustomizable ? (
                <div className="flex items-center gap-1.5 bg-orange-gradient text-white rounded-lg h-7 px-1.5 shadow-lg shadow-primary/20">
                  <button onClick={() => handleQtyChange(-1)} className="hover:bg-white/20 rounded p-0.5"><Minus className="w-2.5 h-2.5" /></button>
                  <span className="text-[9px] font-black w-3 text-center">{cartItemCount}</span>
                  <button onClick={() => handleQtyChange(1)} className="hover:bg-white/20 rounded p-0.5"><Plus className="w-2.5 h-2.5" /></button>
                </div>
              ) : (
                <Button 
                  size="icon" 
                  onClick={handleAddClick} 
                  className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-orange-gradient text-white shadow-lg hover:scale-110 active:scale-95 transition-all border-none"
                >
                  <Plus className="w-3.5 h-3.5" />
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
  }

  return (
    <>
      <div className="group bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all duration-700 flex flex-col h-full relative overflow-hidden border border-border/20">
        {(item.rating >= 4.7 || item.isBestSeller) && (
          <div className="absolute top-5 left-5 z-20 bg-orange-gradient text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl">
            <Sparkles className="w-3.5 h-3.5" /> Best Seller
          </div>
        )}

        <div className="relative aspect-[4/3] overflow-hidden">
          <Image 
            src={displayImageUrl} 
            alt={item.name} 
            fill 
            className="object-cover group-hover:scale-110 transition-transform duration-1000"
            unoptimized
            onError={() => setImgError(true)}
            data-ai-hint={isBiryaniOnMobile ? "chicken biryani" : "fast food"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          
          {!hideVegIndicator && (
            <div className="absolute bottom-5 right-5 z-10">
              <div className={cn(
                "w-7 h-7 bg-white/90 backdrop-blur rounded-xl border-2 flex items-center justify-center",
                item.isVeg ? "border-green-500" : "border-red-500"
              )}>
                <div className={cn("w-2.5 h-2.5 rounded-full", item.isVeg ? "bg-green-500" : "bg-red-500")} />
              </div>
            </div>
          )}

          <div className="absolute bottom-5 left-5 z-10">
            <Badge className="bg-white/90 backdrop-blur text-foreground border-none shadow-2xl font-black px-4 py-2 rounded-2xl flex items-center gap-2">
              <Star className="w-4 h-4 fill-primary text-primary" />
              {item.rating}
            </Badge>
          </div>
        </div>

        <div className="p-8 flex flex-col flex-1">
          <div className="mb-6 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-2xl font-black group-hover:text-primary transition-colors tracking-tight uppercase">{item.name}</h3>
              {item.isCustomizable && <Settings2 className="w-5 h-5 text-primary shrink-0 mt-1" />}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[3rem] leading-relaxed font-medium">
              {item.description}
            </p>
          </div>

          <div className="flex items-center gap-4 text-[10px] text-muted-foreground mb-8 uppercase tracking-widest font-black opacity-60">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> {item.isBeverage ? '8-10 MINS' : '20-25 MINS'}
            </span>
          </div>

          <div className="mt-auto flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-3xl font-black text-primary italic leading-none">₹{item.price}</span>
            </div>

            {cartItemCount > 0 && !item.isBeverage && !item.isCustomizable ? (
              <div className="flex items-center gap-4 bg-orange-gradient text-white rounded-[1.5rem] h-14 px-5 shadow-2xl shadow-primary/30 animate-in zoom-in">
                <button onClick={() => handleQtyChange(-1)} className="w-10 h-10 rounded-xl hover:bg-white/20 flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                <span className="text-xl font-black w-6 text-center">{cartItemCount}</span>
                <button onClick={() => handleQtyChange(1)} className="w-10 h-10 rounded-xl hover:bg-white/20 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
              </div>
            ) : (
              <Button 
                onClick={handleAddClick}
                className="rounded-[1.5rem] px-8 h-14 font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-2xl shadow-primary/30 bg-orange-gradient text-white border-none"
              >
                {item.isCustomizable || item.isBeverage ? 'Customize' : 'Add to Tray'}
                <Plus className="ml-2 w-4 h-4" />
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
