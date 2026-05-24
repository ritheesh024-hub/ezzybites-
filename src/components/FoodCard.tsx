
"use client"
import React, { useState } from 'react';
import Image from 'next/image';
import { Star, Plus, Minus, Clock, Coffee, LayoutGrid, Maximize2 } from 'lucide-react';
import { FoodItem, useStore, BeverageOptions } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BeverageCustomizer } from './BeverageCustomizer';

export const FoodCard = ({ item }: { item: FoodItem }) => {
  const { cart, addToCart, updateQuantity, menuViewMode } = useStore();
  const [isCustomizing, setIsCustomizing] = useState(false);
  
  const hideVegIndicator = ['Tea', 'Coffee', 'Ice creams'].includes(item.category);
  const cartItemCount = cart.filter(i => i.id === item.id).reduce((acc, i) => acc + i.quantity, 0);

  const handleAddClick = () => {
    if (item.isBeverage) {
      setIsCustomizing(true);
    } else {
      addToCart(item);
      toast({
        title: "Added to cart",
        description: `${item.name} is ready for checkout.`,
      });
    }
  };

  const handleCustomizationConfirm = (options: BeverageOptions) => {
    addToCart(item, options);
    setIsCustomizing(false);
    toast({
      title: "Beverage Added",
      description: `${item.name} (${options.size}) added to your tray.`,
    });
  };

  const handleQtyChange = (delta: number) => {
    const targetItem = cart.find(i => i.id === item.id);
    if (targetItem) {
      updateQuantity(targetItem.cartId, delta);
    }
  };

  if (menuViewMode === 'small') {
    return (
      <>
        <div className="group bg-card rounded-[1.5rem] border border-border/40 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full relative">
          <div className="relative aspect-square overflow-hidden bg-secondary">
            <Image 
              src={item.imageUrl} 
              alt={item.name} 
              fill 
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              unoptimized={item.imageUrl.startsWith('http')}
            />
            {!hideVegIndicator && (
              <div className="absolute top-2 right-2 z-10">
                <div className={cn(
                  "w-4 h-4 bg-white/90 backdrop-blur rounded-sm border flex items-center justify-center",
                  item.isVeg ? "border-green-500" : "border-red-500"
                )}>
                  <div className={cn("w-1.5 h-1.5 rounded-full", item.isVeg ? "bg-green-500" : "bg-red-500")} />
                </div>
              </div>
            )}
          </div>
          <div className="p-3 flex flex-col flex-1">
            <h4 className="font-bold text-xs truncate mb-1">{item.name}</h4>
            <div className="mt-auto flex items-center justify-between gap-2">
              <span className="text-sm font-black text-primary">₹{item.price}</span>
              {cartItemCount > 0 && !item.isBeverage ? (
                <div className="flex items-center gap-1 bg-primary text-white rounded-lg h-7 px-1">
                  <button onClick={() => handleQtyChange(-1)} className="w-5 h-5 flex items-center justify-center hover:bg-white/20 rounded">
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="text-[10px] font-black w-3 text-center">{cartItemCount}</span>
                  <button onClick={() => handleQtyChange(1)} className="w-5 h-5 flex items-center justify-center hover:bg-white/20 rounded">
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>
              ) : (
                <Button 
                  size="icon" 
                  onClick={handleAddClick} 
                  className="w-7 h-7 rounded-lg bg-primary text-white shadow-md hover:scale-105"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
        {item.isBeverage && (
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
      <div className="group bg-card rounded-[2.5rem] border border-border/40 overflow-hidden hover:shadow-[0_40px_100px_rgba(0,0,0,0.08)] transition-all duration-700 flex flex-col h-full relative">
        {(item.rating >= 4.7 || item.isBestSeller) && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 bg-primary text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xl shadow-primary/30">
            <Star className="w-3 h-3 fill-current" /> Best Seller
          </div>
        )}

        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          <Image 
            src={item.imageUrl} 
            alt={item.name} 
            fill 
            className="object-cover group-hover:scale-110 transition-transform duration-1000"
            unoptimized={item.imageUrl.startsWith('http')}
          />
          
          {!hideVegIndicator && (
            <div className="absolute top-5 right-5 z-10">
              <div className={cn(
                "w-6 h-6 bg-white/90 backdrop-blur rounded-lg border-2 flex items-center justify-center",
                item.isVeg ? "border-green-500" : "border-red-500"
              )}>
                <div className={cn("w-2 h-2 rounded-full", item.isVeg ? "bg-green-500" : "bg-red-500")} />
              </div>
            </div>
          )}

          <div className="absolute bottom-5 left-5 z-10">
            <Badge className="bg-white/90 backdrop-blur text-foreground border-none shadow-xl font-black px-4 py-1.5 rounded-xl flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              {item.rating}
            </Badge>
          </div>
        </div>

        <div className="p-8 flex flex-col flex-1">
          <div className="mb-6 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black line-clamp-1 group-hover:text-primary transition-colors tracking-tight">{item.name}</h3>
              {item.isBeverage && <Coffee className="w-5 h-5 text-primary shrink-0" />}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem] leading-relaxed font-medium opacity-80">
              {item.description}
            </p>
          </div>

          <div className="flex items-center gap-4 text-[10px] text-muted-foreground mb-8 uppercase tracking-widest font-black opacity-60">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> {item.isBeverage ? '8-10 MINS' : '20-25 MINS'}
            </span>
          </div>

          <div className="mt-auto flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-3xl font-headline font-black text-primary leading-none">₹{item.price}</span>
              {item.isBeverage && <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mt-1">From ₹{item.price}</span>}
            </div>

            {cartItemCount > 0 && !item.isBeverage ? (
              <div className="flex items-center gap-4 bg-primary text-white rounded-2xl h-14 px-4 shadow-xl shadow-primary/20 animate-in zoom-in duration-300">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleQtyChange(-1); }}
                  className="w-10 h-10 rounded-xl hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-xl font-black w-6 text-center">{cartItemCount}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleQtyChange(1); }}
                  className="w-10 h-10 rounded-xl hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Button 
                onClick={handleAddClick}
                className="rounded-2xl px-6 h-14 font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 transition-all shadow-xl shadow-primary/20 bg-primary text-white"
              >
                <div className="flex items-center gap-2">
                  {cartItemCount > 0 ? `Added x${cartItemCount}` : 'Add to Tray'}
                  <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                </div>
              </Button>
            )}
          </div>
        </div>
      </div>

      {item.isBeverage && (
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
